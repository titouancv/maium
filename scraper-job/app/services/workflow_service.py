"""
WorkflowService — all database operations for the async analysis pipeline.

Covers: user_jobs (state machine), jobs (dedup), job_analyses, optimized_resumes,
resume_versions, llm_requests, workflow_events.

supabase-py is a synchronous client; these methods are sync even when called from
async FastAPI handlers. For Celery workers the sync calls are fine. For API handlers
the latency is small (single-row ops) so blocking is acceptable.
"""

import hashlib
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from supabase import Client

from app.schemas.cv import MatchScoreResult, OptimizedCV
from app.schemas.job import JobOffer

logger = logging.getLogger(__name__)


# ─── Helper dataclass returned by find_or_create_job ──────────────────────────

@dataclass
class JobRecord:
    id: str
    offer: JobOffer


# ─── WorkflowService ──────────────────────────────────────────────────────────

class WorkflowService:
    def __init__(self, client: Client) -> None:
        self.client = client

    # ── Workflow (user_jobs) ──────────────────────────────────────────────────

    def create_workflow(
        self,
        tracking_id: str,
        user_id: str,
        idempotency_key: str,
    ) -> dict:
        record = {
            "tracking_id": tracking_id,
            "user_id": user_id,
            "status": "queued",
            "progress": 0,
            "idempotency_key": idempotency_key,
        }
        resp = self.client.table("user_jobs").insert(record).execute()
        return resp.data[0]

    def find_active_workflow(self, idempotency_key: str) -> dict | None:
        """Return the most recent non-failed workflow for this idempotency key."""
        try:
            resp = (
                self.client.table("user_jobs")
                .select("id, tracking_id, status, resume_id")
                .eq("idempotency_key", idempotency_key)
                .in_("status", ["queued", "processing", "completed"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if resp.data:
                return resp.data[0]
        except Exception as exc:
            logger.warning("find_active_workflow error: %s", exc)
        return None

    def get_workflow_by_tracking_id(self, tracking_id: str) -> dict | None:
        try:
            resp = (
                self.client.table("user_jobs")
                .select("*")
                .eq("tracking_id", tracking_id)
                .eq("is_deleted", False)
                .single()
                .execute()
            )
            return resp.data
        except Exception as exc:
            logger.warning("get_workflow_by_tracking_id error: %s", exc)
            return None

    def get_workflow_by_tracking_id_for_user(
        self, tracking_id: str, user_id: str
    ) -> dict | None:
        try:
            resp = (
                self.client.table("user_jobs")
                .select("*")
                .eq("tracking_id", tracking_id)
                .eq("user_id", user_id)
                .eq("is_deleted", False)
                .single()
                .execute()
            )
            return resp.data
        except Exception as exc:
            logger.warning("get_workflow_by_tracking_id_for_user error: %s", exc)
            return None

    def update_step(
        self,
        tracking_id: str,
        step: str,
        progress: int,
        status: str = "processing",
    ) -> None:
        try:
            self.client.table("user_jobs").update(
                {"current_step": step, "progress": progress, "status": status}
            ).eq("tracking_id", tracking_id).execute()
        except Exception as exc:
            logger.error("update_step error | trk=%s: %s", tracking_id, exc)

    def set_job_id(self, tracking_id: str, job_id: str, progress: int) -> None:
        try:
            self.client.table("user_jobs").update(
                {"job_id": job_id, "progress": progress}
            ).eq("tracking_id", tracking_id).execute()
        except Exception as exc:
            logger.error("set_job_id error | trk=%s: %s", tracking_id, exc)

    def set_analysis_id(
        self, tracking_id: str, analysis_id: str, progress: int
    ) -> None:
        try:
            self.client.table("user_jobs").update(
                {"analysis_id": analysis_id, "progress": progress}
            ).eq("tracking_id", tracking_id).execute()
        except Exception as exc:
            logger.error("set_analysis_id error | trk=%s: %s", tracking_id, exc)

    def set_resume_id(
        self,
        tracking_id: str,
        resume_id: str,
        progress: int,
        status: str = "completed",
    ) -> None:
        try:
            self.client.table("user_jobs").update(
                {
                    "resume_id": resume_id,
                    "progress": progress,
                    "status": status,
                    "current_step": None,
                }
            ).eq("tracking_id", tracking_id).execute()
        except Exception as exc:
            logger.error("set_resume_id error | trk=%s: %s", tracking_id, exc)

    def mark_failed(self, tracking_id: str, reason: str) -> None:
        try:
            self.client.table("user_jobs").update(
                {"status": "failed", "failure_reason": reason[:500]}
            ).eq("tracking_id", tracking_id).execute()
        except Exception as exc:
            logger.error("mark_failed error | trk=%s: %s", tracking_id, exc)

    def increment_retry(self, tracking_id: str) -> None:
        try:
            workflow = self.get_workflow_by_tracking_id(tracking_id)
            if workflow:
                new_count = (workflow.get("retry_count") or 0) + 1
                self.client.table("user_jobs").update(
                    {"retry_count": new_count}
                ).eq("tracking_id", tracking_id).execute()
        except Exception as exc:
            logger.warning("increment_retry error | trk=%s: %s", tracking_id, exc)

    # ── jobs (deduplication) ──────────────────────────────────────────────────

    def find_job_by_hash(self, url_hash: str) -> dict | None:
        try:
            resp = (
                self.client.table("jobs")
                .select("*")
                .eq("normalized_url_hash", url_hash)
                .single()
                .execute()
            )
            return resp.data
        except Exception:
            return None

    def save_job(
        self,
        normalized_url: str,
        url_hash: str,
        job: JobOffer,
    ) -> str:
        record = {
            "source_url": normalized_url,
            "normalized_url_hash": url_hash,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "employment_type": job.employment_type,
            "salary": job.salary,
            "seniority": job.seniority,
            "description": job.description[:20_000],  # hard cap
            "extracted_json": job.model_dump(exclude={"raw_html"}),
            "skills": job.skills,
        }
        resp = (
            self.client.table("jobs")
            .upsert(record, on_conflict="normalized_url_hash")
            .execute()
        )
        return resp.data[0]["id"]

    def get_job_by_id(self, job_id: str) -> dict | None:
        try:
            resp = (
                self.client.table("jobs")
                .select("*")
                .eq("id", job_id)
                .single()
                .execute()
            )
            return resp.data
        except Exception:
            return None

    # ── job_analyses ──────────────────────────────────────────────────────────

    def save_analysis(
        self,
        user_job_id: str,
        user_id: str,
        job_id: str,
        match_result: MatchScoreResult,
        model_name: str,
        prompt_version: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
    ) -> str:
        record = {
            "user_id": user_id,
            "job_id": job_id,
            "user_job_id": user_job_id,
            "matching_score": match_result.match_score,
            "confidence_score": 0.9,
            "analysis_json": match_result.model_dump(),
            "model_name": model_name,
            "prompt_version": prompt_version,
            "token_usage": {"input": input_tokens, "output": output_tokens},
            "latency_ms": latency_ms,
        }
        resp = self.client.table("job_analyses").insert(record).execute()
        return resp.data[0]["id"]

    # ── optimized_resumes ─────────────────────────────────────────────────────

    def save_optimized_resume(
        self,
        user_job_id: str,
        user_id: str,
        job_id: str,
        analysis_id: str,
        optimized_cv: OptimizedCV,
    ) -> str:
        record = {
            "user_id": user_id,
            "job_id": job_id,
            "analysis_id": analysis_id,
            "user_job_id": user_job_id,
            "optimized_resume_json": optimized_cv.model_dump(),
            "version": 1,
            "is_active": True,
        }
        resp = self.client.table("optimized_resumes").insert(record).execute()
        resume_id: str = resp.data[0]["id"]

        # Persist the initial version in resume_versions
        self._save_resume_version(resume_id, 1, optimized_cv.model_dump())

        return resume_id

    def _save_resume_version(
        self, resume_id: str, version_number: int, resume_json: dict
    ) -> None:
        try:
            self.client.table("resume_versions").insert(
                {
                    "resume_id": resume_id,
                    "version_number": version_number,
                    "resume_json": resume_json,
                }
            ).execute()
        except Exception as exc:
            logger.warning("save_resume_version error: %s", exc)

    def soft_delete_resume(self, resume_id: str, user_id: str) -> bool:
        try:
            resp = (
                self.client.table("optimized_resumes")
                .update({"is_deleted": True})
                .eq("id", resume_id)
                .eq("user_id", user_id)
                .execute()
            )
            return bool(resp.data)
        except Exception as exc:
            logger.error("soft_delete_resume error: %s", exc)
            return False

    # ── Read endpoints ────────────────────────────────────────────────────────

    def get_resume_detail(self, resume_id: str, user_id: str) -> dict | None:
        """
        Fetch optimized_resumes row with nested jobs and job_analyses.
        Returns None if not found or deleted.
        """
        try:
            resp = (
                self.client.table("optimized_resumes")
                .select(
                    "id, user_job_id, optimized_resume_json, version, created_at,"
                    "jobs(id, title, company, location, source_url),"
                    "job_analyses(id, matching_score, confidence_score, analysis_json),"
                    "user_jobs(tracking_id, status)"
                )
                .eq("id", resume_id)
                .eq("user_id", user_id)
                .eq("is_deleted", False)
                .single()
                .execute()
            )
            return resp.data
        except Exception as exc:
            logger.warning("get_resume_detail error: %s", exc)
            return None

    def get_history(self, user_id: str) -> list[dict]:
        """
        Return completed resume analyses for the user, most recent first.
        Joins jobs for metadata and optimized_resumes for score.
        """
        try:
            resp = (
                self.client.table("user_jobs")
                .select(
                    "id, tracking_id, status, resume_id, created_at,"
                    "jobs(title, company, location, source_url),"
                    "optimized_resumes(id, optimized_resume_json)"
                )
                .eq("user_id", user_id)
                .in_("status", ["completed", "failed", "processing", "queued"])
                .eq("is_deleted", False)
                .order("created_at", desc=True)
                .limit(50)
                .execute()
            )
            return resp.data or []
        except Exception as exc:
            logger.warning("get_history error: %s", exc)
            return []

    # ── Observability ─────────────────────────────────────────────────────────

    def log_event(
        self,
        user_job_id: str,
        event_type: str,
        payload: dict | None = None,
    ) -> None:
        try:
            self.client.table("workflow_events").insert(
                {
                    "user_job_id": user_job_id,
                    "event_type": event_type,
                    "payload": payload or {},
                }
            ).execute()
        except Exception as exc:
            logger.warning("log_event error [%s]: %s", event_type, exc)

    def log_llm_request(
        self,
        user_id: str,
        user_job_id: str,
        provider: str,
        model: str,
        operation: str,
        input_tokens: int,
        output_tokens: int,
        latency_ms: int,
        status: str = "success",
        error_message: str | None = None,
        prompt_hash: str | None = None,
    ) -> None:
        try:
            self.client.table("llm_requests").insert(
                {
                    "user_id": user_id,
                    "user_job_id": user_job_id,
                    "provider": provider,
                    "model": model,
                    "operation": operation,
                    "prompt_hash": prompt_hash,
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "latency_ms": latency_ms,
                    "status": status,
                    "error_message": error_message,
                }
            ).execute()
        except Exception as exc:
            logger.warning("log_llm_request error: %s", exc)


# ─── Rate limiting (Redis-based sliding window) ────────────────────────────────

def check_rate_limit(user_id: str, redis_url: str, max_per_hour: int) -> bool:
    """
    Increment per-user hourly counter. Returns True if within limit, False if exceeded.
    Fails open on Redis errors so a cache outage never blocks users.
    """
    import redis as redis_lib

    try:
        r = redis_lib.from_url(redis_url, decode_responses=True, socket_timeout=1)
        key = f"rl:analyze:{user_id}"
        count = r.get(key)
        if count and int(count) >= max_per_hour:
            return False
        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 3600)
        pipe.execute()
        return True
    except Exception as exc:
        logger.warning("Rate limit Redis error (failing open): %s", exc)
        return True


# ─── URL normalization ────────────────────────────────────────────────────────

_TRACKING_PARAMS = frozenset({
    "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
    "ref", "fbclid", "gclid", "msclkid", "twclid",
    "lever-source", "lever-origin",  # Lever-specific
})


def normalize_url(url: str) -> str:
    """Remove tracking query params and trailing slash/fragment."""
    from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

    parsed = urlparse(url.strip())
    qs = parse_qs(parsed.query, keep_blank_values=True)
    filtered = {k: v for k, v in qs.items() if k.lower() not in _TRACKING_PARAMS}
    normalized = parsed._replace(
        query=urlencode(filtered, doseq=True),
        fragment="",
    )
    return urlunparse(normalized).rstrip("/")


def url_hash(normalized_url: str) -> str:
    return hashlib.sha256(normalized_url.encode()).hexdigest()
