"""
Main async analysis pipeline — Celery task.

Workflow steps (checkpoint-based, idempotent on retry):
  1. JOB_EXTRACTION    — normalize URL, dedup jobs table, scrape if needed
  2. PROFILE_MATCHING  — fetch user profile, LLM match score, save job_analysis
  3. RESUME_OPTIMIZATION — LLM optimize CV, post-validate, save optimized_resume
"""

import asyncio
import logging

from celery import Celery
from celery.utils.log import get_task_logger

from app.core.config import get_settings
from app.core.logging import (
    current_tracking_id,
    current_user_id,
    current_worker,
)

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
    result_expires=3600 * 24,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_routes={
        "tasks.analyze_resume": {"queue": "analysis"},
    },
)

task_logger = get_task_logger(__name__)


def _backoff(retry_index: int) -> int:
    return min(2 ** retry_index * 5, 120)


# ─── Main Celery task ─────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    name="tasks.analyze_resume",
    max_retries=3,
    soft_time_limit=180,
    time_limit=240,
    acks_late=True,
)
def analyze_resume_task(
    self, tracking_id: str, user_id: str, job_url: str
) -> None:
    """
    Entry point for the full analysis pipeline.
    Retries up to 3 times with exponential backoff.
    On exhaustion, marks the workflow as failed.
    """
    current_tracking_id.set(tracking_id)
    current_user_id.set(user_id)
    current_worker.set("analyze_resume_task")

    task_logger.info(
        "Pipeline start | tracking_id=%s | user=%s | url=%s",
        tracking_id, user_id, job_url,
    )

    try:
        asyncio.run(_run_pipeline(tracking_id, user_id, job_url))
        task_logger.info("Pipeline completed | tracking_id=%s", tracking_id)

    except Exception as exc:
        retry_index = self.request.retries
        task_logger.error(
            "Pipeline error (attempt %d/3) | tracking_id=%s | error=%s",
            retry_index + 1, tracking_id, exc,
            exc_info=True,
        )

        if retry_index < self.max_retries:
            # Increment retry counter in DB before re-raising
            asyncio.run(_increment_retry_safe(tracking_id))
            raise self.retry(exc=exc, countdown=_backoff(retry_index))

        # Max retries exhausted → mark as failed
        asyncio.run(_mark_failed_safe(tracking_id, str(exc)))
        raise


# ─── Pipeline orchestrator ────────────────────────────────────────────────────

async def _run_pipeline(tracking_id: str, user_id: str, job_url: str) -> None:
    from app.services.supabase_service import get_supabase_client
    from app.services.workflow_service import WorkflowService

    client = get_supabase_client()
    ws = WorkflowService(client)

    workflow = ws.get_workflow_by_tracking_id(tracking_id)
    if not workflow:
        raise RuntimeError(f"Workflow not found: {tracking_id}")

    user_job_id: str = workflow["id"]

    if workflow["status"] in ("completed", "cancelled"):
        task_logger.info(
            "Workflow already %s — skipping | tracking_id=%s",
            workflow["status"], tracking_id,
        )
        return

    # ── Step 1: Job extraction ────────────────────────────────────────────────
    job_id = workflow.get("job_id")
    if not job_id:
        job_id, job_offer = await _step_job_extraction(
            tracking_id, user_job_id, job_url, ws
        )
    else:
        row = ws.get_job_by_id(job_id)
        if not row:
            raise RuntimeError(f"Job row missing for job_id={job_id}")
        from app.services.scraper_service import _row_to_job_offer
        job_offer = _row_to_job_offer(row)
        task_logger.info(
            "Job already extracted | job_id=%s | tracking_id=%s", job_id, tracking_id
        )

    # ── Step 2: Profile matching ──────────────────────────────────────────────
    analysis_id = workflow.get("analysis_id")
    if not analysis_id:
        analysis_id = await _step_profile_matching(
            tracking_id, user_job_id, user_id, job_id, job_offer, ws
        )

    # ── Step 3: Resume optimization ───────────────────────────────────────────
    resume_id = workflow.get("resume_id")
    if not resume_id:
        await _step_resume_optimization(
            tracking_id, user_job_id, user_id, job_id, analysis_id, job_offer, ws
        )


# ─── Step implementations ─────────────────────────────────────────────────────

async def _step_job_extraction(
    tracking_id: str,
    user_job_id: str,
    job_url: str,
    ws,
) -> tuple[str, object]:
    ws.update_step(tracking_id, "JOB_EXTRACTION", 10, "processing")

    from app.services.scraper_service import scrape_and_deduplicate

    job_id, job_offer = await scrape_and_deduplicate(job_url, ws)

    ws.set_job_id(tracking_id, job_id, progress=30)
    ws.log_event(user_job_id, "JOB_EXTRACTION_COMPLETED", {"job_id": job_id})

    task_logger.info(
        "Job extraction done | tracking_id=%s | job_id=%s | title=%s",
        tracking_id, job_id, job_offer.title,
    )
    return job_id, job_offer


async def _step_profile_matching(
    tracking_id: str,
    user_job_id: str,
    user_id: str,
    job_id: str,
    job_offer,
    ws,
) -> str:
    ws.update_step(tracking_id, "PROFILE_MATCHING", 35)

    from app.services.ats_service import (
        compute_ats_score,
        estimate_experience_years,
        profile_to_text,
    )
    from app.services.mistral_service import MistralService
    from app.services.supabase_service import fetch_user_profile

    profile = await fetch_user_profile(user_id)
    exp_years = estimate_experience_years(profile.professional_experiences)

    mistral = MistralService()
    match_result, call_info = await mistral.score_match(profile, job_offer)

    # Blend LLM score with heuristic ATS score for a more reliable result
    heuristic_score = compute_ats_score(
        profile_to_text(profile),
        job_offer.description,
        job_offer.skills,
        seniority=job_offer.seniority,
        experience_years=exp_years,
    )
    blended_score = int(match_result.match_score * 0.7 + heuristic_score * 0.3)
    match_result = match_result.model_copy(update={"match_score": blended_score})

    analysis_id = ws.save_analysis(
        user_job_id=user_job_id,
        user_id=user_id,
        job_id=job_id,
        match_result=match_result,
        model_name=settings.MISTRAL_MODEL,
        prompt_version=settings.PROMPT_VERSION,
        input_tokens=call_info.input_tokens,
        output_tokens=call_info.output_tokens,
        latency_ms=call_info.latency_ms,
    )

    ws.log_llm_request(
        user_id=user_id,
        user_job_id=user_job_id,
        provider="mistral",
        model=settings.MISTRAL_MODEL,
        operation="match_analysis",
        input_tokens=call_info.input_tokens,
        output_tokens=call_info.output_tokens,
        latency_ms=call_info.latency_ms,
        prompt_hash=call_info.prompt_hash,
    )

    ws.set_analysis_id(tracking_id, analysis_id, progress=65)
    ws.log_event(
        user_job_id, "PROFILE_MATCH_COMPLETED",
        {"analysis_id": analysis_id, "match_score": blended_score},
    )

    task_logger.info(
        "Profile matching done | tracking_id=%s | match_score=%d | analysis_id=%s",
        tracking_id, blended_score, analysis_id,
    )
    return analysis_id


async def _step_resume_optimization(
    tracking_id: str,
    user_job_id: str,
    user_id: str,
    job_id: str,
    analysis_id: str,
    job_offer,
    ws,
) -> None:
    ws.update_step(tracking_id, "RESUME_OPTIMIZATION", 70)

    from app.services.ats_service import (
        compute_ats_score,
        estimate_experience_years,
        optimized_cv_to_text,
        profile_to_text,
    )
    from app.services.mistral_service import MistralService
    from app.services.supabase_service import fetch_user_profile

    profile = await fetch_user_profile(user_id)
    exp_years = estimate_experience_years(profile.professional_experiences)

    mistral = MistralService()
    optimized_cv, call_info = await mistral.optimize_cv(profile, job_offer)

    # ATS scores before & after
    ats_before = compute_ats_score(
        profile_to_text(profile),
        job_offer.description,
        job_offer.skills,
        seniority=job_offer.seniority,
        experience_years=exp_years,
    )
    ats_after = compute_ats_score(
        optimized_cv_to_text(optimized_cv),
        job_offer.description,
        job_offer.skills,
        seniority=job_offer.seniority,
        experience_years=exp_years,
    )
    optimized_cv = optimized_cv.model_copy(
        update={"ats_score_before": ats_before, "ats_score_after": ats_after}
    )

    ws.log_llm_request(
        user_id=user_id,
        user_job_id=user_job_id,
        provider="mistral",
        model=settings.MISTRAL_MODEL,
        operation="resume_optimization",
        input_tokens=call_info.input_tokens,
        output_tokens=call_info.output_tokens,
        latency_ms=call_info.latency_ms,
        prompt_hash=call_info.prompt_hash,
    )

    resume_id = ws.save_optimized_resume(
        user_job_id=user_job_id,
        user_id=user_id,
        job_id=job_id,
        analysis_id=analysis_id,
        optimized_cv=optimized_cv,
    )

    ws.set_resume_id(tracking_id, resume_id, progress=100, status="completed")
    ws.log_event(
        user_job_id, "RESUME_OPTIMIZATION_COMPLETED",
        {"resume_id": resume_id, "ats_before": ats_before, "ats_after": ats_after},
    )

    task_logger.info(
        "Resume optimization done | tracking_id=%s | resume_id=%s | ats %d→%d",
        tracking_id, resume_id, ats_before, ats_after,
    )


# ─── Error helpers ────────────────────────────────────────────────────────────

async def _mark_failed_safe(tracking_id: str, reason: str) -> None:
    try:
        from app.services.supabase_service import get_supabase_client
        from app.services.workflow_service import WorkflowService

        client = get_supabase_client()
        WorkflowService(client).mark_failed(tracking_id, reason)
    except Exception as exc:
        task_logger.error("mark_failed_safe error: %s", exc)


async def _increment_retry_safe(tracking_id: str) -> None:
    try:
        from app.services.supabase_service import get_supabase_client
        from app.services.workflow_service import WorkflowService

        client = get_supabase_client()
        WorkflowService(client).increment_retry(tracking_id)
    except Exception as exc:
        task_logger.warning("increment_retry_safe error: %s", exc)
