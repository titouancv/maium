"""
Scraping router: detect provider → check dedup cache → scrape → persist.

Key changes vs v1:
  - URL is normalized (tracking params stripped) before hashing
  - Deduplication uses the new `jobs` table (WorkflowService), not cached_jobs
  - Raw HTML is sanitized before any LLM call (see core/sanitizer.py)
  - scrape_job() is the legacy helper kept for POST /jobs/parse
  - scrape_and_deduplicate() is the pipeline entry point used by the worker
"""

import hashlib
import logging
from datetime import datetime, timezone

from app.core.config import get_settings
from app.schemas.job import JobOffer

logger = logging.getLogger(__name__)
settings = get_settings()


# ─── Provider detection ───────────────────────────────────────────────────────

def detect_provider(url: str) -> str:
    if "greenhouse.io" in url:
        return "greenhouse"
    if "lever.co" in url:
        return "lever"
    return "generic"


# ─── Pipeline entry point (used by the Celery worker) ─────────────────────────

async def scrape_and_deduplicate(
    url: str,
    workflow_service,  # WorkflowService — typed as Any to avoid circular import
) -> tuple[str, JobOffer]:
    """
    Normalize URL → check jobs table → scrape if needed → persist → return (job_id, offer).
    Returns the existing job_id if the offer was already processed.
    """
    from app.services.workflow_service import normalize_url, url_hash

    norm_url = normalize_url(url)
    h = url_hash(norm_url)

    existing = workflow_service.find_job_by_hash(h)
    if existing:
        logger.info("Job dedup hit | hash=%s | id=%s", h[:12], existing["id"])
        offer = _row_to_job_offer(existing)
        return existing["id"], offer

    logger.info("Scraping new job | url=%s", norm_url)
    offer = await _scrape(norm_url)

    job_id = workflow_service.save_job(norm_url, h, offer)
    logger.info("Job saved | id=%s | title=%s @ %s", job_id, offer.title, offer.company)

    return job_id, offer


# ─── Legacy helper (POST /jobs/parse — uses old cached_jobs table) ─────────────

async def scrape_job(url: str, supabase_client=None) -> JobOffer:
    """
    Scrape with 24h cache in `cached_jobs` (legacy endpoint).
    The pipeline uses scrape_and_deduplicate() instead.
    """
    from app.services.workflow_service import normalize_url, url_hash as _url_hash

    norm_url = normalize_url(url)
    h = hashlib.sha256(norm_url.encode()).hexdigest()

    if supabase_client:
        cached = _get_cached_job(supabase_client, h)
        if cached:
            logger.info("Cache hit (cached_jobs) | url=%s", norm_url)
            return JobOffer(**cached)

    offer = await _scrape(norm_url)

    if supabase_client:
        _cache_job(supabase_client, h, norm_url, offer)

    return offer


# ─── Core scrape dispatcher ───────────────────────────────────────────────────

async def _scrape(url: str) -> JobOffer:
    provider = detect_provider(url)
    logger.info("Provider=%s | url=%s", provider, url)

    if provider == "greenhouse":
        from app.scrapers.greenhouse import GreenhouseScraper
        return await GreenhouseScraper().scrape(url)
    if provider == "lever":
        from app.scrapers.lever import LeverScraper
        return await LeverScraper().scrape(url)

    from app.scrapers.generic import GenericScraper
    return await GenericScraper().scrape(url)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _row_to_job_offer(row: dict) -> JobOffer:
    """Re-hydrate a JobOffer from a jobs table row."""
    extracted = row.get("extracted_json") or {}
    return JobOffer(
        title=row.get("title") or extracted.get("title", ""),
        company=row.get("company") or extracted.get("company", ""),
        location=row.get("location") or extracted.get("location"),
        employment_type=row.get("employment_type") or extracted.get("employment_type"),
        salary=row.get("salary") or extracted.get("salary"),
        description=row.get("description") or extracted.get("description", ""),
        skills=row.get("skills") or extracted.get("skills", []),
        seniority=row.get("seniority") or extracted.get("seniority"),
    )


def _get_cached_job(client, url_hash: str) -> dict | None:
    try:
        now = datetime.now(timezone.utc).isoformat()
        resp = (
            client.table("cached_jobs")
            .select("parsed_json")
            .eq("url_hash", url_hash)
            .gt("expires_at", now)
            .maybe_single()
            .execute()
        )
        if resp and resp.data:
            return resp.data["parsed_json"]
    except Exception as exc:
        logger.warning("cached_jobs read error: %s", exc)
    return None


def _cache_job(client, url_hash: str, url: str, job: JobOffer) -> None:
    from datetime import timedelta
    try:
        expires_at = (
            datetime.now(timezone.utc)
            + timedelta(seconds=settings.CACHE_TTL_SECONDS)
        ).isoformat()
        payload = job.model_dump(exclude={"raw_html"})
        client.table("cached_jobs").upsert(
            {
                "url_hash": url_hash,
                "original_url": url,
                "parsed_json": payload,
                "expires_at": expires_at,
            }
        ).execute()
    except Exception as exc:
        logger.warning("cached_jobs write error: %s", exc)
