"""
Celery tasks for the CV optimizer and match score pipelines.

Architecture:
    POST /cv/optimize        → optimize_cv_task   → GET /tasks/{task_id}
    POST /cv/match-score     → match_score_task   → GET /tasks/match/{task_id}

Both tasks are queued in Redis and polled by the frontend.
"""
import asyncio

from celery import Celery
from celery.utils.log import get_task_logger

from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "cv_optimizer",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    result_expires=3600 * 24,   # Results expire after 24 h
    task_track_started=True,
    worker_prefetch_multiplier=1,  # Avoid overloading on long-running tasks
    task_acks_late=True,           # Re-queue if the worker crashes mid-task
)

task_logger = get_task_logger(__name__)


# ---------------------------------------------------------------------------
# CV Optimization task
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="tasks.optimize_cv",
    max_retries=3,
    default_retry_delay=5,
    soft_time_limit=120,
    time_limit=180,
)
def optimize_cv_task(self, user_id: str, job_url: str) -> dict:
    """
    Main Celery task.
    Runs the CV optimization pipeline asynchronously.
    Returns a JSON-serialisable dict.
    """
    task_logger.info("Starting optimize_cv_task | user=%s | url=%s", user_id, job_url)

    try:
        result = asyncio.run(_run_optimize(user_id, job_url))
        task_logger.info(
            "optimize_cv_task completed | user=%s | ats_score=%d",
            user_id,
            result["ats_score"],
        )
        return result

    except Exception as exc:
        task_logger.error("optimize_cv_task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 5)


async def _run_optimize(user_id: str, job_url: str) -> dict:
    """Async wrapper so Celery (sync) can call run_cv_optimization."""
    from app.services.cv_optimizer import run_cv_optimization
    optimized = await run_cv_optimization(user_id, job_url)
    return optimized.model_dump()


# ---------------------------------------------------------------------------
# CV–Job Match Score task
# ---------------------------------------------------------------------------

@celery_app.task(
    bind=True,
    name="tasks.match_score",
    max_retries=3,
    default_retry_delay=5,
    soft_time_limit=90,
    time_limit=120,
)
def match_score_task(self, user_id: str, job_url: str) -> dict:
    """
    Celery task: compute a detailed CV–job compatibility score via Mistral.
    Lighter than the full optimization — no CV generation, no PDF, no persistence.
    Returns a JSON-serialisable MatchScoreResult dict.
    """
    task_logger.info("Starting match_score_task | user=%s | url=%s", user_id, job_url)

    try:
        result = asyncio.run(_run_match_score(user_id, job_url))
        task_logger.info(
            "match_score_task completed | user=%s | match_score=%d",
            user_id,
            result["match_score"],
        )
        return result

    except Exception as exc:
        task_logger.error("match_score_task failed: %s", exc, exc_info=True)
        raise self.retry(exc=exc, countdown=2 ** self.request.retries * 5)


async def _run_match_score(user_id: str, job_url: str) -> dict:
    """
    Async pipeline for match scoring:
    1. Scrape the job offer (cached)
    2. Fetch the user profile from Supabase
    3. Call MistralService.score_match(profile, job)
    """
    from app.services.mistral_service import MistralService
    from app.services.scraper_service import scrape_job
    from app.services.supabase_service import fetch_user_profile, get_supabase_client

    client = get_supabase_client()

    job = await scrape_job(job_url, supabase_client=client)
    profile = await fetch_user_profile(user_id, client=client)

    mistral = MistralService()
    match_result = await mistral.score_match(profile, job)

    return match_result.model_dump()
