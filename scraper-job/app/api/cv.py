"""
CV endpoints:
  POST /cv/optimize      — Queue a full CV optimization (Celery)
  POST /cv/match-score   — Queue a CV–job compatibility analysis (Celery)
"""
import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.cv import CVOptimizeRequest, CVOptimizeResponse, MatchScoreRequest, MatchScoreResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/cv", tags=["cv"])

# TODO: re-add auth once testing is complete
_TEST_USER_ID = "860f0e86-315c-4a22-a084-a6d5a3bb3c64"


@router.post("/optimize", response_model=CVOptimizeResponse, status_code=status.HTTP_202_ACCEPTED)
async def optimize_cv(body: CVOptimizeRequest):
    """
    Queue a CV optimization as an async Celery task.
    Returns a `task_id` immediately; the frontend polls GET /tasks/{task_id}.
    """
    user_id = _TEST_USER_ID
    from app.workers.tasks import optimize_cv_task

    logger.info("optimize_cv | user=%s | url=%s", user_id, body.job_url)

    try:
        task = optimize_cv_task.delay(user_id, body.job_url)
    except Exception as exc:
        logger.error("Failed to create Celery task: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable. Please try again in a moment.",
        )

    return CVOptimizeResponse(task_id=task.id, status="pending")


@router.post("/match-score", response_model=MatchScoreResponse, status_code=status.HTTP_202_ACCEPTED)
async def match_score(body: MatchScoreRequest):
    """
    Queue a CV–job compatibility analysis as an async Celery task.

    Mistral evaluates the match between the authenticated user's profile
    and the scraped job offer, then returns:
    - an overall `match_score` (0–100)
    - a skill breakdown (matched / missing / bonus skills)
    - an experience alignment score
    - concrete strengths and gaps
    - an actionable recommendation

    Returns a `task_id` immediately; the frontend polls GET /tasks/match/{task_id}.
    """
    user_id = _TEST_USER_ID
    from app.workers.tasks import match_score_task

    logger.info("match_score | user=%s | url=%s", user_id, body.job_url)

    try:
        task = match_score_task.delay(user_id, body.job_url)
    except Exception as exc:
        logger.error("Failed to create match_score Celery task: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable. Please try again in a moment.",
        )

    return MatchScoreResponse(task_id=task.id, status="pending")
