"""
Test configuration.

IMPORTANT: env vars and sys.modules mocks must be set at module level
(before any app import) because get_settings() is @lru_cache.
"""

import os
import sys
from unittest.mock import AsyncMock, MagicMock

# ── 1. Environment variables ───────────────────────────────────────────────────
os.environ.update(
    {
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "test-service-role-key",
        "MISTRAL_API_KEY": "test-mistral-key",
        "MISTRAL_MODEL": "mistral-large-latest",
        "REDIS_URL": "redis://localhost:6379/0",
        "CELERY_BROKER_URL": "redis://localhost:6379/0",
        "CELERY_RESULT_BACKEND": "redis://localhost:6379/0",
        "RATE_LIMIT_REQUESTS_PER_HOUR": "10",
        "APP_ENV": "test",
        "LOG_LEVEL": "WARNING",
    }
)

# ── 2. Mock unavailable packages ───────────────────────────────────────────────
# supabase — heavy SDK, not installed locally
_supabase_mock = MagicMock()
sys.modules.setdefault("supabase", _supabase_mock)

# playwright — browser automation, not installed locally
sys.modules.setdefault("playwright", MagicMock())
sys.modules.setdefault("playwright.async_api", MagicMock())

# selectolax — C extension, not installed locally
sys.modules.setdefault("selectolax", MagicMock())
sys.modules.setdefault("selectolax.parser", MagicMock())

# python-jose — crypto, not installed locally
sys.modules.setdefault("jose", MagicMock())
sys.modules.setdefault("jose.exceptions", MagicMock())

# ── 3. Fixtures ────────────────────────────────────────────────────────────────
import pytest
from unittest.mock import patch, MagicMock

TEST_USER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"
TEST_TRACKING_ID = "trk_abc123def456789"
TEST_RESUME_ID = "11111111-2222-3333-4444-555555555555"
TEST_JOB_ID = "66666666-7777-8888-9999-aaaaaaaaaaaa"
TEST_ANALYSIS_ID = "bbbbbbbb-cccc-dddd-eeee-ffffffffffff"


def make_mock_supabase_client():
    """Return a MagicMock that looks like a supabase.Client for testing."""
    client = MagicMock()
    # Default chain: .table().select()...execute() → returns empty data
    table_mock = MagicMock()
    client.table.return_value = table_mock
    table_mock.select.return_value = table_mock
    table_mock.insert.return_value = table_mock
    table_mock.update.return_value = table_mock
    table_mock.upsert.return_value = table_mock
    table_mock.delete.return_value = table_mock
    table_mock.eq.return_value = table_mock
    table_mock.neq.return_value = table_mock
    table_mock.in_.return_value = table_mock
    table_mock.gt.return_value = table_mock
    table_mock.lt.return_value = table_mock
    table_mock.order.return_value = table_mock
    table_mock.limit.return_value = table_mock
    table_mock.single.return_value = table_mock
    table_mock.maybe_single.return_value = table_mock
    table_mock.execute.return_value = MagicMock(data=None)
    return client


@pytest.fixture
def mock_supabase():
    """Supabase client with default empty responses."""
    return make_mock_supabase_client()


@pytest.fixture
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


@pytest.fixture
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
                    "bullet_points": ["Built APIs", "Led team"],
                }
            ],
            "missing_keywords_before": ["Kubernetes"],
            "missing_keywords_after": ["Kubernetes"],
            "ats_score_before": 45,
            "ats_score_after": 72,
        },
        "jobs": {
            "id": TEST_JOB_ID,
            "title": "Senior Python Engineer",
            "company": "TechCorp",
            "location": "Paris",
            "source_url": "https://techcorp.com/jobs/123",
        },
        "job_analyses": {
            "id": TEST_ANALYSIS_ID,
            "matching_score": 72,
            "confidence_score": 0.88,
            "analysis_json": {
                "match_score": 72,
                "experience_match": 80,
                "skills_match": {
                    "matched": ["Python", "FastAPI"],
                    "missing": ["Kubernetes"],
                    "bonus": ["Docker"],
                },
                "strengths": ["Strong Python background"],
                "gaps": ["Missing Kubernetes experience"],
                "profile_summary": "Good fit for the role.",
                "recommendation": "Apply and highlight Python expertise.",
            },
        },
        "user_jobs": {
            "tracking_id": TEST_TRACKING_ID,
            "status": "completed",
        },
    }
