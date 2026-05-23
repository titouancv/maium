from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# CV Optimization
# ---------------------------------------------------------------------------

class CVOptimizeRequest(BaseModel):
    job_url: str


class OptimizedExperience(BaseModel):
    title: str
    company: str
    period: str | None = None
    bullet_points: list[str] = []


class OptimizedCV(BaseModel):
    summary: str
    highlighted_skills: list[str]
    optimized_experiences: list[OptimizedExperience]
    missing_keywords: list[str]
    ats_score: int = Field(ge=0, le=100)


class CVOptimizeResponse(BaseModel):
    task_id: str
    status: str = "pending"


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
    matched: list[str] = []   # skills present in both profile and job
    missing: list[str] = []   # required skills from job not found in profile
    bonus: list[str] = []     # candidate skills that are a plus even if not required


class MatchScoreResult(BaseModel):
    """Full match analysis returned by Mistral."""
    match_score: int = Field(ge=0, le=100, description="Overall compatibility score (0–100)")
    experience_match: int = Field(ge=0, le=100, description="Seniority/experience alignment score (0–100)")
    skills_match: SkillMatch
    strengths: list[str] = []
    gaps: list[str] = []
    profile_summary: str
    recommendation: str


class MatchScoreRequest(BaseModel):
    job_url: str


class MatchScoreResponse(BaseModel):
    task_id: str
    status: str = "pending"


class MatchTaskStatusResponse(BaseModel):
    task_id: str
    status: str  # pending | processing | completed | failed
    result: MatchScoreResult | None = None
    error: str | None = None
