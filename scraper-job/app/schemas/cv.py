from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# CV Optimization
# ---------------------------------------------------------------------------


class CVOptimizeRequest(BaseModel):
    job_url: str
    user_id: str


class OptimizedExperience(BaseModel):
    title: str
    company: str
    period: str | None = None
    bullet_points: list[str] = []


class OptimizedCV(BaseModel):
    summary: str
    highlighted_skills: list[str]
    optimized_experiences: list[OptimizedExperience]
    # Keywords missing from the original profile vs the job offer
    missing_keywords_before: list[str] = []
    # Keywords still missing from the optimised CV (no matching background)
    missing_keywords_after: list[str] = []
    # ATS score of the original profile vs the job offer
    ats_score_before: int = Field(default=0, ge=0, le=100)
    # ATS score of the optimised CV vs the job offer
    ats_score_after: int = Field(default=0, ge=0, le=100)


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str  # pending | processing | completed | failed
    result: OptimizedCV | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# CV–Job Match Score
# ---------------------------------------------------------------------------


class SkillMatch(BaseModel):
    """Breakdown of skill compatibility between a profile and a job offer."""

    matched: list[str] = []  # skills present in both profile and job
    missing: list[str] = []  # required skills from job not found in profile
    bonus: list[str] = []  # candidate skills that are a plus even if not required


class MatchScoreResult(BaseModel):
    """Full match analysis returned by Mistral."""

    match_score: int = Field(
        ge=0, le=100, description="Overall compatibility score (0–100)"
    )
    experience_match: int = Field(
        ge=0, le=100, description="Seniority/experience alignment score (0–100)"
    )
    skills_match: SkillMatch
    strengths: list[str] = []
    gaps: list[str] = []
    profile_summary: str
    recommendation: str


class MatchScoreRequest(BaseModel):
    job_url: str
    user_id: str


class MatchScoreResponse(BaseModel):
    task_id: str
    status: str = "pending"


class MatchTaskStatusResponse(BaseModel):
    task_id: str
    status: str  # pending | processing | completed | failed
    result: MatchScoreResult | None = None
    error: str | None = None
