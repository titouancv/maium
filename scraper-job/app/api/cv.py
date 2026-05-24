"""
CV endpoints:
  POST /cv/optimize      — Synchronous pipeline: scrape job → user profile → Mistral → OptimizedCV JSON
  POST /cv/match-score   — Queue a CV–job compatibility analysis (Celery)
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.cv import (
    CVOptimizeRequest,
    MatchScoreRequest,
    MatchScoreResponse,
    OptimizedCV,
)
from app.services.cv_optimizer import run_cv_optimization

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cv", tags=["cv"])


@router.post("/optimize", response_model=OptimizedCV)
async def optimize_cv(body: CVOptimizeRequest):
    """
    Full CV optimization pipeline (synchronous).

    Steps:
      1. Scrape the job offer from the provided URL
      2. Fetch the user's profile from Supabase via `user_id`
      3. Call Mistral to generate optimized CV fields
      4. Persist the result in `optimized_cvs`
      5. Return the optimized CV as JSON
    """
    logger.info("optimize_cv | user=%s | url=%s", body.user_id, body.job_url)

    try:
        optimized = await run_cv_optimization(body.user_id, body.job_url)
        return optimized
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.error("optimize_cv error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="CV optimization failed. Please try again.",
        )


@router.post(
    "/match-score",
    response_model=MatchScoreResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def match_score(body: MatchScoreRequest):
    """
    Queue a CV–job compatibility analysis as an async Celery task.

    Returns a `task_id` immediately; poll GET /tasks/match/{task_id} for the result.
    """
    from app.workers.tasks import match_score_task

    logger.info("match_score | user=%s | url=%s", body.user_id, body.job_url)

    try:
        task = match_score_task.delay(body.user_id, body.job_url)
    except Exception as exc:
        logger.error("Failed to create match_score Celery task: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable. Please try again in a moment.",
        )

    return MatchScoreResponse(task_id=task.id, status="pending")
