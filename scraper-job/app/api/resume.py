"""
/resume/* endpoints — async analysis pipeline.

POST   /resume/analyze               Launch analysis, return trackingId immediately
GET    /resume/history               User's analysis history
GET    /resume/status/{tracking_id}  Poll workflow progress
GET    /resume/{resume_id}           Fetch completed result
DELETE /resume/{resume_id}           Soft-delete a resume
"""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.logging import current_tracking_id, current_user_id
from app.core.security import get_current_user_id
from app.schemas.cv import MatchScoreResult, OptimizedCV
from app.schemas.resume import (
    AnalyzeResumeRequest,
    AnalyzeResumeResponse,
    DeleteResumeResponse,
    ResumeDetailResponse,
    ResumeHistoryItem,
    ResumeHistoryResponse,
    WorkflowStatusResponse,
)
from app.services.supabase_service import get_supabase_client
from app.services.workflow_service import (
    WorkflowService,
    check_rate_limit,
    url_hash,
    normalize_url,
)

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/resume", tags=["resume"])


# ─── POST /resume/analyze ──────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=AnalyzeResumeResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def analyze_resume(
    body: AnalyzeResumeRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Validate → deduplicate → queue the analysis pipeline.
    Returns a trackingId immediately; poll /resume/status/{trackingId} for progress.
    """
    current_user_id.set(user_id)
    logger.info("analyze_resume | user=%s | url=%s", user_id, body.jobUrl)

    # Rate limiting
    if not check_rate_limit(user_id, settings.REDIS_URL, settings.RATE_LIMIT_REQUESTS_PER_HOUR):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded ({settings.RATE_LIMIT_REQUESTS_PER_HOUR} requests/hour).",
        )

    client = get_supabase_client()
    ws = WorkflowService(client)

    # Idempotency: same user + same normalized URL → reuse existing workflow
    norm_url = normalize_url(body.jobUrl)
    idem_key = url_hash(f"{user_id}:{norm_url}")

    existing = ws.find_active_workflow(idem_key)
    if existing:
        logger.info(
            "Duplicate request — returning existing workflow | trk=%s | user=%s",
            existing["tracking_id"], user_id,
        )
        return AnalyzeResumeResponse(
            trackingId=existing["tracking_id"],
            status=existing["status"],
            estimatedDurationSeconds=settings.ESTIMATED_DURATION_SECONDS,
        )

    tracking_id = f"trk_{uuid.uuid4().hex[:16]}"
    current_tracking_id.set(tracking_id)

    try:
        ws.create_workflow(tracking_id, user_id, idem_key)
    except Exception as exc:
        logger.error("create_workflow error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not create analysis job. Try again in a moment.",
        )

    # Queue the Celery task
    try:
        from app.workers.pipeline import analyze_resume_task
        analyze_resume_task.delay(tracking_id, user_id, body.jobUrl)
    except Exception as exc:
        logger.error("Celery enqueue failed: %s", exc, exc_info=True)
        ws.mark_failed(tracking_id, "Failed to enqueue task")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Queue unavailable. Try again in a moment.",
        )

    logger.info("Queued | tracking_id=%s | user=%s", tracking_id, user_id)
    return AnalyzeResumeResponse(
        trackingId=tracking_id,
        status="queued",
        estimatedDurationSeconds=settings.ESTIMATED_DURATION_SECONDS,
    )


# ─── GET /resume/history ───────────────────────────────────────────────────────
# Must be declared BEFORE /resume/{resume_id} so FastAPI matches the static path first.

@router.get("/history", response_model=ResumeHistoryResponse)
async def get_history(user_id: str = Depends(get_current_user_id)):
    """Return the user's analysis history, most recent first."""
    client = get_supabase_client()
    ws = WorkflowService(client)
    rows = ws.get_history(user_id)

    items: list[ResumeHistoryItem] = []
    for row in rows:
        job = row.get("jobs") or {}
        resume_list = row.get("optimized_resumes") or []
        resume = resume_list[0] if resume_list else {}
        resume_json = resume.get("optimized_resume_json") or {}

        resume_id = resume.get("id") or row.get("resume_id") or ""

        items.append(
            ResumeHistoryItem(
                resumeId=resume_id,
                trackingId=row["tracking_id"],
                jobTitle=job.get("title", ""),
                company=job.get("company", ""),
                location=job.get("location"),
                jobUrl=job.get("source_url", ""),
                matchingScore=resume_json.get("ats_score_after", 0),
                status=row["status"],
                createdAt=row["created_at"],
            )
        )

    return ResumeHistoryResponse(resumes=items, total=len(items))


# ─── GET /resume/status/{tracking_id} ────────────────────────────────────────

@router.get("/status/{tracking_id}", response_model=WorkflowStatusResponse)
async def get_workflow_status(
    tracking_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Poll the progress of an analysis workflow."""
    client = get_supabase_client()
    ws = WorkflowService(client)
    workflow = ws.get_workflow_by_tracking_id_for_user(tracking_id, user_id)

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracking ID not found.",
        )

    return WorkflowStatusResponse(
        trackingId=workflow["tracking_id"],
        status=workflow["status"],
        currentStep=workflow.get("current_step"),
        progress=workflow.get("progress", 0),
        resumeId=workflow.get("resume_id"),
        failureReason=workflow.get("failure_reason"),
        createdAt=workflow["created_at"],
        updatedAt=workflow["updated_at"],
    )


# ─── GET /resume/{resume_id} ──────────────────────────────────────────────────

@router.get("/{resume_id}", response_model=ResumeDetailResponse)
async def get_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Fetch a completed resume analysis with full CV and match details."""
    client = get_supabase_client()
    ws = WorkflowService(client)
    row = ws.get_resume_detail(resume_id, user_id)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found.",
        )

    job = row.get("jobs") or {}
    analysis_row = row.get("job_analyses") or {}
    user_job = row.get("user_jobs") or {}

    # Deserialize nested JSONB → Pydantic
    analysis: MatchScoreResult | None = None
    if analysis_row.get("analysis_json"):
        try:
            analysis = MatchScoreResult(**analysis_row["analysis_json"])
        except Exception as exc:
            logger.warning("MatchScoreResult deserialization error: %s", exc)

    optimized_resume: OptimizedCV | None = None
    if row.get("optimized_resume_json"):
        try:
            optimized_resume = OptimizedCV(**row["optimized_resume_json"])
        except Exception as exc:
            logger.warning("OptimizedCV deserialization error: %s", exc)

    return ResumeDetailResponse(
        resumeId=row["id"],
        trackingId=user_job.get("tracking_id", ""),
        status=user_job.get("status", "completed"),
        jobTitle=job.get("title", ""),
        company=job.get("company", ""),
        location=job.get("location"),
        jobUrl=job.get("source_url", ""),
        matchingScore=analysis_row.get("matching_score", 0),
        confidenceScore=analysis_row.get("confidence_score", 0.0),
        analysis=analysis,
        optimizedResume=optimized_resume,
        createdAt=row["created_at"],
    )


# ─── DELETE /resume/{resume_id} ───────────────────────────────────────────────

@router.delete("/{resume_id}", response_model=DeleteResumeResponse)
async def delete_resume(
    resume_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Soft-delete a resume (is_deleted = true). Non-recoverable via API."""
    client = get_supabase_client()
    ws = WorkflowService(client)
    deleted = ws.soft_delete_resume(resume_id, user_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found or already deleted.",
        )

    logger.info("Resume soft-deleted | id=%s | user=%s", resume_id, user_id)
    return DeleteResumeResponse(success=True)
