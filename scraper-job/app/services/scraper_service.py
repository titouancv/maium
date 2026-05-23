"""
Scraping router:
1. Detect the provider from the URL
2. Check the Redis cache (cached_jobs in Supabase)
3. Dispatch to the appropriate scraper
4. Cache the result
"""
import hashlib
import logging
from datetime import datetime, timezone

from app.core.config import get_settings
from app.schemas.job import JobOffer

logger = logging.getLogger(__name__)
settings = get_settings()


def detect_provider(url: str) -> str:
    if "greenhouse.io" in url:
        return "greenhouse"
    if "lever.co" in url:
        return "lever"
    return "generic"


async def scrape_job(url: str, supabase_client=None) -> JobOffer:
    """
    Main entry point.
    - Checks the Supabase cache
    - Dispatches to the right scraper
    - Stores the result in cache
    """
    url_hash = hashlib.sha256(url.encode()).hexdigest()

    # --- Cache lookup ---
    if supabase_client:
        cached = _get_cached_job(supabase_client, url_hash)
        if cached:
            logger.info("Cache hit for %s", url)
            return JobOffer(**cached)

    # --- Scraping ---
    provider = detect_provider(url)
    logger.info("Provider detected: %s for %s", provider, url)

    job: JobOffer
    if provider == "greenhouse":
        from app.scrapers.greenhouse import GreenhouseScraper
        job = await GreenhouseScraper().scrape(url)
    elif provider == "lever":
        from app.scrapers.lever import LeverScraper
        job = await LeverScraper().scrape(url)
    else:
        from app.scrapers.generic import GenericScraper
        job = await GenericScraper().scrape(url)

    # --- Cache write ---
    if supabase_client:
        _cache_job(supabase_client, url_hash, url, job)

    return job


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _get_cached_job(client, url_hash: str) -> dict | None:
    try:
        now = datetime.now(timezone.utc).isoformat()
        resp = (
            client.table("cached_jobs")
            .select("parsed_json")
            .eq("url_hash", url_hash)
            .gt("expires_at", now)
            .maybe_single()  # returns None data (no exception) when 0 rows
            .execute()
        )
        if resp and resp.data:
            return resp.data["parsed_json"]
    except Exception as exc:
        logger.warning("Cache read error: %s", exc)
    return None


def _cache_job(client, url_hash: str, url: str, job: JobOffer) -> None:
    from datetime import timedelta
    try:
        expires_at = (
            datetime.now(timezone.utc) + timedelta(seconds=settings.CACHE_TTL_SECONDS)
        ).isoformat()
        # raw_html is not stored in cache
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
        logger.warning("Cache write error: %s", exc)
