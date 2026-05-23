"""
Task polling endpoints:
  GET /tasks/{task_id}         — Poll a CV optimization task
  GET /tasks/match/{task_id}  — Poll a CV–job match score task
"""
import logging

from celery.result import AsyncResult
from fastapi import APIRouter

from app.schemas.cv import MatchScoreResult, MatchTaskStatusResponse, OptimizedCV, TaskStatusResponse
from app.workers.tasks import celery_app

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tasks", tags=["tasks"])


def _celery_state_to_status(state: str) -> str:
    """Map a Celery task state to the API status string."""
    if state == "PENDING":
        return "pending"
    if state == "STARTED":
        return "processing"
    if state in ("FAILURE", "REVOKED"):
        return "failed"
    return "processing"  # RETRY or unknown


@router.get("/match/{task_id}", response_model=MatchTaskStatusResponse)
async def get_match_task_status(task_id: str):
    """
    Return the status of a CV–job match score task (POST /cv/match-score).

    Possible statuses:
    - `pending`    : waiting in the queue
    - `processing` : currently running
    - `completed`  : finished — `result` contains the MatchScoreResult
    - `failed`     : error — `error` contains the message
    """
    result: AsyncResult = AsyncResult(task_id, app=celery_app)
    celery_state = result.state

    if celery_state == "SUCCESS":
        try:
            match_result = MatchScoreResult(**result.result)
            return MatchTaskStatusResponse(task_id=task_id, status="completed", result=match_result)
        except Exception as exc:
            logger.error("Failed to deserialise match result for task %s: %s", task_id, exc)
            return MatchTaskStatusResponse(
                task_id=task_id,
                status="failed",
                error="Invalid result payload",
            )

    if celery_state in ("FAILURE", "REVOKED"):
        error_msg = str(result.result) if result.result else "Unknown error"
        return MatchTaskStatusResponse(task_id=task_id, status="failed", error=error_msg)

    return MatchTaskStatusResponse(task_id=task_id, status=_celery_state_to_status(celery_state))


@router.get("/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """
    Return the status of a CV optimization task (POST /cv/optimize).

    Possible statuses:
    - `pending`    : waiting in the queue
    - `processing` : currently running
    - `completed`  : finished — `result` contains the optimized CV
    - `failed`     : error — `error` contains the message
    """
    result: AsyncResult = AsyncResult(task_id, app=celery_app)
    celery_state = result.state

    if celery_state == "SUCCESS":
        try:
            optimized = OptimizedCV(**result.result)
            return TaskStatusResponse(task_id=task_id, status="completed", result=optimized)
        except Exception as exc:
            logger.error("Failed to deserialise result for task %s: %s", task_id, exc)
            return TaskStatusResponse(
                task_id=task_id,
                status="failed",
                error="Invalid result payload",
            )

    if celery_state in ("FAILURE", "REVOKED"):
        error_msg = str(result.result) if result.result else "Unknown error"
        return TaskStatusResponse(task_id=task_id, status="failed", error=error_msg)

    return TaskStatusResponse(task_id=task_id, status=_celery_state_to_status(celery_state))
