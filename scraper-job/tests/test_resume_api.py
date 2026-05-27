"""
Integration tests for the /resume/* FastAPI endpoints.

All external dependencies (Supabase, Redis, Celery) are mocked.
"""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from tests.conftest import TEST_USER_ID, TEST_TRACKING_ID, TEST_RESUME_ID


# ── App setup with dependency overrides ───────────────────────────────────────

@pytest.fixture(scope="module")
def client(sample_workflow_row, sample_resume_detail_row):
    # Import here so conftest env vars + sys.modules mocks are already set
    from app.main import app
    from app.core.security import get_current_user_id

    # Override JWT auth for all tests
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def sample_workflow_row():
    return {
        "id": "wfid-1111-2222-3333",
        "tracking_id": TEST_TRACKING_ID,
        "user_id": TEST_USER_ID,
        "job_id": None,
        "analysis_id": None,
        "resume_id": None,
        "status": "queued",
        "current_step": None,
        "progress": 0,
        "failure_reason": None,
        "retry_count": 0,
        "idempotency_key": "somekey",
        "is_deleted": False,
        "created_at": "2026-05-28T10:00:00Z",
        "updated_at": "2026-05-28T10:00:01Z",
    }


@pytest.fixture(scope="module")
def sample_resume_detail_row():
    return {
        "id": TEST_RESUME_ID,
        "user_job_id": "wfid-1111-2222-3333",
        "version": 1,
        "is_deleted": False,
        "created_at": "2026-05-28T10:05:00Z",
        "optimized_resume_json": {
            "summary": "Experienced engineer",
            "highlighted_skills": ["Python", "FastAPI"],
            "optimized_experiences": [
                {
                    "title": "Software Engineer",
                    "company": "Acme",
                    "period": "2022-2024",
                    "bullet_points": ["Built APIs"],
                }
            ],
            "missing_keywords_before": ["Kubernetes"],
            "missing_keywords_after": ["Kubernetes"],
            "ats_score_before": 45,
            "ats_score_after": 72,
        },
        "jobs": {
            "id": "66666666-7777-8888-9999-aaaaaaaaaaaa",
            "title": "Senior Python Engineer",
            "company": "TechCorp",
            "location": "Paris",
            "source_url": "https://techcorp.com/jobs/123",
        },
        "job_analyses": {
            "id": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
            "matching_score": 72,
            "confidence_score": 0.88,
            "analysis_json": {
                "match_score": 72,
                "experience_match": 80,
                "skills_match": {
                    "matched": ["Python"],
                    "missing": ["Kubernetes"],
                    "bonus": ["Docker"],
                },
                "strengths": ["Strong Python"],
                "gaps": ["Kubernetes missing"],
                "profile_summary": "Good fit.",
                "recommendation": "Apply.",
            },
        },
        "user_jobs": {
            "tracking_id": TEST_TRACKING_ID,
            "status": "completed",
        },
    }


# ── POST /resume/analyze ───────────────────────────────────────────────────────

class TestAnalyzeEndpoint:
    def test_returns_202_with_tracking_id(self, client, sample_workflow_row):
        mock_ws = MagicMock()
        mock_ws.find_active_workflow.return_value = None
        mock_ws.create_workflow.return_value = sample_workflow_row

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws), \
             patch("app.api.resume.check_rate_limit", return_value=True), \
             patch("app.workers.pipeline.analyze_resume_task") as mock_task:
            mock_task.delay.return_value = None

            resp = client.post(
                "/resume/analyze",
                json={"jobUrl": "https://example.com/jobs/123"},
            )

        assert resp.status_code == 202
        data = resp.json()
        assert "trackingId" in data
        assert data["trackingId"].startswith("trk_")
        assert data["status"] == "queued"

    def test_returns_202_for_duplicate_request(self, client, sample_workflow_row):
        existing = {"tracking_id": TEST_TRACKING_ID, "status": "processing", "resume_id": None}
        mock_ws = MagicMock()
        mock_ws.find_active_workflow.return_value = existing

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws), \
             patch("app.api.resume.check_rate_limit", return_value=True):

            resp = client.post(
                "/resume/analyze",
                json={"jobUrl": "https://example.com/jobs/123"},
            )

        assert resp.status_code == 202
        data = resp.json()
        assert data["trackingId"] == TEST_TRACKING_ID
        assert data["status"] == "processing"

    def test_returns_429_when_rate_limited(self, client):
        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=MagicMock()), \
             patch("app.api.resume.check_rate_limit", return_value=False):

            resp = client.post(
                "/resume/analyze",
                json={"jobUrl": "https://example.com/jobs/123"},
            )

        assert resp.status_code == 429

    def test_returns_400_for_invalid_url(self, client):
        resp = client.post(
            "/resume/analyze",
            json={"jobUrl": "not-a-url"},
        )
        assert resp.status_code == 422

    def test_returns_400_for_missing_url(self, client):
        resp = client.post("/resume/analyze", json={})
        assert resp.status_code == 422

    def test_returns_503_when_celery_down(self, client, sample_workflow_row):
        mock_ws = MagicMock()
        mock_ws.find_active_workflow.return_value = None
        mock_ws.create_workflow.return_value = sample_workflow_row

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws), \
             patch("app.api.resume.check_rate_limit", return_value=True), \
             patch("app.workers.pipeline.analyze_resume_task") as mock_task:
            mock_task.delay.side_effect = Exception("Redis unreachable")

            resp = client.post(
                "/resume/analyze",
                json={"jobUrl": "https://example.com/jobs/123"},
            )

        assert resp.status_code == 503

    def test_requires_auth(self):
        from app.main import app
        from app.core.security import get_current_user_id
        from fastapi import HTTPException

        # Remove override so real auth runs
        app.dependency_overrides.pop(get_current_user_id, None)

        with TestClient(app, raise_server_exceptions=False) as unauthd_client:
            resp = unauthd_client.post(
                "/resume/analyze",
                json={"jobUrl": "https://example.com/jobs/123"},
            )

        assert resp.status_code == 401

        # Restore override
        app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID


# ── GET /resume/history ────────────────────────────────────────────────────────

class TestHistoryEndpoint:
    def test_returns_200_with_list(self, client):
        mock_ws = MagicMock()
        mock_ws.get_history.return_value = [
            {
                "tracking_id": TEST_TRACKING_ID,
                "status": "completed",
                "resume_id": TEST_RESUME_ID,
                "created_at": "2026-05-28T10:00:00Z",
                "jobs": {
                    "title": "Senior Engineer",
                    "company": "TechCorp",
                    "location": "Paris",
                    "source_url": "https://techcorp.com/jobs/1",
                },
                "optimized_resumes": [
                    {"id": TEST_RESUME_ID, "optimized_resume_json": {"ats_score_after": 72}}
                ],
            }
        ]

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.get("/resume/history")

        assert resp.status_code == 200
        data = resp.json()
        assert "resumes" in data
        assert "total" in data
        assert data["total"] == 1
        assert data["resumes"][0]["trackingId"] == TEST_TRACKING_ID
        assert data["resumes"][0]["jobTitle"] == "Senior Engineer"

    def test_returns_empty_list(self, client):
        mock_ws = MagicMock()
        mock_ws.get_history.return_value = []

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.get("/resume/history")

        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["resumes"] == []


# ── GET /resume/status/{tracking_id} ──────────────────────────────────────────

class TestStatusEndpoint:
    def test_returns_200_for_existing_workflow(self, client, sample_workflow_row):
        mock_ws = MagicMock()
        mock_ws.get_workflow_by_tracking_id_for_user.return_value = sample_workflow_row

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.get(f"/resume/status/{TEST_TRACKING_ID}")

        assert resp.status_code == 200
        data = resp.json()
        assert data["trackingId"] == TEST_TRACKING_ID
        assert data["status"] == "queued"
        assert data["progress"] == 0

    def test_returns_404_for_unknown_tracking_id(self, client):
        mock_ws = MagicMock()
        mock_ws.get_workflow_by_tracking_id_for_user.return_value = None

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.get("/resume/status/trk_doesnotexist")

        assert resp.status_code == 404

    def test_completed_workflow_has_resume_id(self, client, sample_workflow_row):
        completed = {**sample_workflow_row, "status": "completed", "resume_id": TEST_RESUME_ID, "progress": 100}
        mock_ws = MagicMock()
        mock_ws.get_workflow_by_tracking_id_for_user.return_value = completed

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.get(f"/resume/status/{TEST_TRACKING_ID}")

        data = resp.json()
        assert data["status"] == "completed"
        assert data["resumeId"] == TEST_RESUME_ID
        assert data["progress"] == 100


# ── GET /resume/{resume_id} ───────────────────────────────────────────────────

class TestGetResumeEndpoint:
    def test_returns_200_with_full_detail(self, client, sample_resume_detail_row):
        mock_ws = MagicMock()
        mock_ws.get_resume_detail.return_value = sample_resume_detail_row

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.get(f"/resume/{TEST_RESUME_ID}")

        assert resp.status_code == 200
        data = resp.json()
        assert data["resumeId"] == TEST_RESUME_ID
        assert data["jobTitle"] == "Senior Python Engineer"
        assert data["company"] == "TechCorp"
        assert data["matchingScore"] == 72
        assert data["optimizedResume"]["ats_score_before"] == 45
        assert data["analysis"] is not None

    def test_returns_404_when_not_found(self, client):
        mock_ws = MagicMock()
        mock_ws.get_resume_detail.return_value = None

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.get(f"/resume/nonexistent-id")

        assert resp.status_code == 404


# ── DELETE /resume/{resume_id} ────────────────────────────────────────────────

class TestDeleteResumeEndpoint:
    def test_returns_200_on_success(self, client):
        mock_ws = MagicMock()
        mock_ws.soft_delete_resume.return_value = True

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.delete(f"/resume/{TEST_RESUME_ID}")

        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True

    def test_returns_404_when_not_found(self, client):
        mock_ws = MagicMock()
        mock_ws.soft_delete_resume.return_value = False

        with patch("app.api.resume.get_supabase_client", return_value=MagicMock()), \
             patch("app.api.resume.WorkflowService", return_value=mock_ws):
            resp = client.delete("/resume/nonexistent-id")

        assert resp.status_code == 404


# ── Health check ───────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
