"""
API schemas for the /resume/* endpoints.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.cv import MatchScoreResult, OptimizedCV

# ─── Workflow status ───────────────────────────────────────────────────────────

WorkflowStatus = Literal["queued", "processing", "completed", "failed", "cancelled"]
WorkflowStep = Literal["JOB_EXTRACTION", "PROFILE_MATCHING", "RESUME_OPTIMIZATION"]


# ─── POST /resume/analyze ──────────────────────────────────────────────────────

class AnalyzeResumeRequest(BaseModel):
    jobUrl: str = Field(..., description="Public URL of the job offer to analyze")

    @field_validator("jobUrl")
    @classmethod
    def must_be_http(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            raise ValueError("jobUrl must start with http:// or https://")
        if len(v) > 2048:
            raise ValueError("jobUrl is too long (max 2048 chars)")
        return v


class AnalyzeResumeResponse(BaseModel):
    trackingId: str
    status: WorkflowStatus = "queued"
    estimatedDurationSeconds: int = 45


# ─── GET /resume/status/:trackingId ───────────────────────────────────────────

class WorkflowStatusResponse(BaseModel):
    trackingId: str
    status: WorkflowStatus
    currentStep: WorkflowStep | None = None
    progress: int = Field(ge=0, le=100, default=0)
    resumeId: str | None = None
    failureReason: str | None = None
    createdAt: datetime
    updatedAt: datetime


# ─── GET /resume/:resumeId ────────────────────────────────────────────────────

class ResumeDetailResponse(BaseModel):
    resumeId: str
    trackingId: str
    status: WorkflowStatus
    jobTitle: str
    company: str
    location: str | None = None
    jobUrl: str
    matchingScore: int = Field(ge=0, le=100, default=0)
    confidenceScore: float = Field(ge=0.0, le=1.0, default=0.0)
    analysis: MatchScoreResult | None = None
    optimizedResume: OptimizedCV | None = None
    createdAt: datetime


# ─── GET /resume/history ──────────────────────────────────────────────────────

class ResumeHistoryItem(BaseModel):
    resumeId: str
    trackingId: str
    jobTitle: str
    company: str
    location: str | None = None
    jobUrl: str
    matchingScore: int = Field(ge=0, le=100, default=0)
    status: WorkflowStatus
    createdAt: datetime


class ResumeHistoryResponse(BaseModel):
    resumes: list[ResumeHistoryItem]
    total: int


# ─── DELETE /resume/:resumeId ─────────────────────────────────────────────────

class DeleteResumeResponse(BaseModel):
    success: bool = True
