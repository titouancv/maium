"""Tests for Pydantic schema validation (app/schemas/)"""

from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas.resume import (
    AnalyzeResumeRequest,
    AnalyzeResumeResponse,
    DeleteResumeResponse,
    ResumeDetailResponse,
    WorkflowStatusResponse,
)
from app.schemas.job import JobOffer, JobParseResponse
from app.schemas.cv import OptimizedCV, OptimizedExperience, MatchScoreResult, SkillMatch


# ── AnalyzeResumeRequest ──────────────────────────────────────────────────────

class TestAnalyzeResumeRequest:
    def test_valid_https_url(self):
        req = AnalyzeResumeRequest(jobUrl="https://example.com/job/123")
        assert req.jobUrl == "https://example.com/job/123"

    def test_valid_http_url(self):
        req = AnalyzeResumeRequest(jobUrl="http://example.com/job/123")
        assert req.jobUrl == "http://example.com/job/123"

    def test_strips_whitespace(self):
        req = AnalyzeResumeRequest(jobUrl="  https://example.com/job  ")
        assert req.jobUrl == "https://example.com/job"

    def test_rejects_missing_protocol(self):
        with pytest.raises(ValidationError) as exc_info:
            AnalyzeResumeRequest(jobUrl="example.com/job/123")
        assert "http" in str(exc_info.value).lower()

    def test_rejects_non_http_protocol(self):
        with pytest.raises(ValidationError):
            AnalyzeResumeRequest(jobUrl="ftp://example.com/job")

    def test_rejects_url_too_long(self):
        with pytest.raises(ValidationError):
            AnalyzeResumeRequest(jobUrl="https://example.com/" + "a" * 2048)

    def test_rejects_missing_field(self):
        with pytest.raises(ValidationError):
            AnalyzeResumeRequest()


# ── AnalyzeResumeResponse ─────────────────────────────────────────────────────

class TestAnalyzeResumeResponse:
    def test_default_status(self):
        resp = AnalyzeResumeResponse(trackingId="trk_abc123")
        assert resp.status == "queued"

    def test_default_estimated_duration(self):
        resp = AnalyzeResumeResponse(trackingId="trk_abc123")
        assert resp.estimatedDurationSeconds == 45

    def test_custom_values(self):
        resp = AnalyzeResumeResponse(
            trackingId="trk_xyz", status="processing", estimatedDurationSeconds=60
        )
        assert resp.trackingId == "trk_xyz"
        assert resp.status == "processing"


# ── WorkflowStatusResponse ───────────────────────────────────────────────────

class TestWorkflowStatusResponse:
    def _now(self):
        return datetime.now(timezone.utc)

    def test_queued_state(self):
        resp = WorkflowStatusResponse(
            trackingId="trk_abc",
            status="queued",
            progress=0,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        assert resp.currentStep is None
        assert resp.resumeId is None
        assert resp.progress == 0

    def test_processing_state_with_step(self):
        resp = WorkflowStatusResponse(
            trackingId="trk_abc",
            status="processing",
            currentStep="PROFILE_MATCHING",
            progress=60,
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        assert resp.currentStep == "PROFILE_MATCHING"
        assert resp.progress == 60

    def test_completed_state(self):
        resp = WorkflowStatusResponse(
            trackingId="trk_abc",
            status="completed",
            progress=100,
            resumeId="some-uuid",
            createdAt=self._now(),
            updatedAt=self._now(),
        )
        assert resp.resumeId == "some-uuid"
        assert resp.progress == 100

    def test_progress_clamped(self):
        with pytest.raises(ValidationError):
            WorkflowStatusResponse(
                trackingId="trk_abc",
                status="processing",
                progress=150,  # > 100
                createdAt=self._now(),
                updatedAt=self._now(),
            )

    def test_invalid_status_is_rejected(self):
        # Literal type — "invalid" is not a valid status
        with pytest.raises(ValidationError):
            WorkflowStatusResponse(
                trackingId="trk_abc",
                status="invalid_status",
                progress=0,
                createdAt=self._now(),
                updatedAt=self._now(),
            )


# ── JobOffer ──────────────────────────────────────────────────────────────────

class TestJobOffer:
    def test_minimal_job_offer(self):
        job = JobOffer(title="Engineer", company="Acme", description="Job description")
        assert job.skills == []
        assert job.seniority is None
        assert job.raw_html is None

    def test_full_job_offer(self):
        job = JobOffer(
            title="Senior Python Engineer",
            company="TechCorp",
            location="Paris",
            employment_type="Full-time",
            salary="70k-90k EUR",
            description="Build APIs with Python",
            skills=["Python", "FastAPI", "Docker"],
            seniority="Senior",
        )
        assert job.employment_type == "Full-time"
        assert job.salary == "70k-90k EUR"

    def test_raw_html_not_exposed_in_parse_response(self):
        # JobParseResponse does not have raw_html field
        parse_resp = JobParseResponse(
            title="Engineer",
            company="Acme",
            description="desc",
            skills=[],
        )
        assert not hasattr(parse_resp, "raw_html")


# ── OptimizedCV ───────────────────────────────────────────────────────────────

class TestOptimizedCv:
    def test_minimal_cv(self):
        cv = OptimizedCV(
            summary="Experienced engineer",
            highlighted_skills=["Python"],
            optimized_experiences=[],
        )
        assert cv.ats_score_before == 0
        assert cv.ats_score_after == 0

    def test_ats_score_bounds(self):
        with pytest.raises(ValidationError):
            OptimizedCV(
                summary="ok",
                highlighted_skills=[],
                optimized_experiences=[],
                ats_score_before=150,  # > 100
            )

    def test_optimized_experience(self):
        exp = OptimizedExperience(
            title="Software Engineer",
            company="Acme",
            period="2022-2024",
            bullet_points=["Built APIs"],
        )
        assert exp.period == "2022-2024"


# ── MatchScoreResult ──────────────────────────────────────────────────────────

class TestMatchScoreResult:
    def test_valid_result(self):
        result = MatchScoreResult(
            match_score=75,
            experience_match=80,
            skills_match=SkillMatch(
                matched=["Python"],
                missing=["Kubernetes"],
                bonus=["Docker"],
            ),
            profile_summary="Good fit.",
            recommendation="Apply now.",
        )
        assert result.match_score == 75

    def test_score_out_of_range(self):
        with pytest.raises(ValidationError):
            MatchScoreResult(
                match_score=150,
                experience_match=80,
                skills_match=SkillMatch(),
                profile_summary="x",
                recommendation="y",
            )

    def test_negative_score_rejected(self):
        with pytest.raises(ValidationError):
            MatchScoreResult(
                match_score=-5,
                experience_match=80,
                skills_match=SkillMatch(),
                profile_summary="x",
                recommendation="y",
            )
