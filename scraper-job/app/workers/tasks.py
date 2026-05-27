"""
Legacy Celery tasks — kept for backward compatibility.
New code should use app.workers.pipeline.analyze_resume_task.

celery_app is re-exported from pipeline so Docker Compose references either module.
"""

import asyncio

from celery.utils.log import get_task_logger

from app.workers.pipeline import celery_app  # single shared instance

task_logger = get_task_logger(__name__)


# ── Legacy: CV optimization (synchronous pipeline, deprecated) ────────────────

@celery_app.task(
    bind=True,
    name="tasks.optimize_cv",
    max_retries=3,
    default_retry_delay=5,
    soft_time_limit=120,
    time_limit=180,
)
def optimize_cv_task(self, user_id: str, job_url: str) -> dict:
    task_logger.warning(
        "optimize_cv_task is deprecated — use tasks.analyze_resume | user=%s", user_id
    )
    try:
        result = asyncio.run(_run_optimize(user_id, job_url))
        return result
    except Exception as exc:
        task_logger.error("optimize_cv_task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 5)


async def _run_optimize(user_id: str, job_url: str) -> dict:
    from app.services.cv_optimizer import run_cv_optimization

    optimized = await run_cv_optimization(user_id, job_url)
    return optimized.model_dump()


# ── Legacy: Match score (deprecated) ──────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="tasks.match_score",
    max_retries=3,
    default_retry_delay=5,
    soft_time_limit=90,
    time_limit=120,
)
def match_score_task(self, user_id: str, job_url: str) -> dict:
    task_logger.warning(
        "match_score_task is deprecated — use tasks.analyze_resume | user=%s", user_id
    )
    try:
        result = asyncio.run(_run_match_score(user_id, job_url))
        return result
    except Exception as exc:
        task_logger.error("match_score_task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 5)


async def _run_match_score(user_id: str, job_url: str) -> dict:
    from app.services.mistral_service import MistralService
    from app.services.scraper_service import scrape_job
    from app.services.supabase_service import fetch_user_profile, get_supabase_client

    client = get_supabase_client()
    job = await scrape_job(job_url, supabase_client=client)
    profile = await fetch_user_profile(user_id, client=client)
    mistral = MistralService()
    match_result, _ = await mistral.score_match(profile, job)
    return match_result.model_dump()
