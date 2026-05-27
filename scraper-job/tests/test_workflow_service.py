"""Tests for URL normalization, hashing, and rate limiting in workflow_service.py"""

import pytest
from unittest.mock import MagicMock, patch, call

from app.services.workflow_service import (
    WorkflowService,
    check_rate_limit,
    normalize_url,
    url_hash,
)


# ── normalize_url ─────────────────────────────────────────────────────────────

class TestNormalizeUrl:
    def test_removes_utm_source(self):
        url = "https://example.com/job/123?utm_source=linkedin"
        assert "utm_source" not in normalize_url(url)

    def test_removes_utm_campaign(self):
        url = "https://example.com/job?utm_campaign=spring&title=engineer"
        result = normalize_url(url)
        assert "utm_campaign" not in result
        assert "title=engineer" in result

    def test_removes_all_tracking_params(self):
        url = "https://example.com/job?ref=twitter&fbclid=abc&gclid=xyz&id=42"
        result = normalize_url(url)
        assert "ref=" not in result
        assert "fbclid=" not in result
        assert "gclid=" not in result
        assert "id=42" in result  # non-tracking param kept

    def test_removes_trailing_slash(self):
        url = "https://example.com/job/123/"
        result = normalize_url(url)
        assert not result.endswith("/")

    def test_removes_fragment(self):
        url = "https://example.com/job/123#requirements"
        result = normalize_url(url)
        assert "#requirements" not in result

    def test_preserves_path_and_query(self):
        url = "https://greenhouse.io/job/456?source=careers"
        result = normalize_url(url)
        assert "greenhouse.io/job/456" in result
        assert "source=careers" in result

    def test_strips_trailing_whitespace(self):
        url = "  https://example.com/job/123  "
        result = normalize_url(url)
        assert result == "https://example.com/job/123"

    def test_lever_url_strips_lever_source(self):
        url = "https://jobs.lever.co/company/abc-123?lever-source=linkedin&lever-origin=applied"
        result = normalize_url(url)
        assert "lever-source" not in result
        assert "lever-origin" not in result
        assert "abc-123" in result


# ── url_hash ──────────────────────────────────────────────────────────────────

class TestUrlHash:
    def test_deterministic(self):
        h1 = url_hash("https://example.com/job/123")
        h2 = url_hash("https://example.com/job/123")
        assert h1 == h2

    def test_different_urls_different_hashes(self):
        h1 = url_hash("https://example.com/job/123")
        h2 = url_hash("https://example.com/job/456")
        assert h1 != h2

    def test_returns_hex_string(self):
        h = url_hash("https://example.com/job/123")
        assert all(c in "0123456789abcdef" for c in h)
        assert len(h) == 64  # SHA-256 hex digest

    def test_normalized_urls_have_same_hash(self):
        url_with_tracking = "https://example.com/job/123?utm_source=test"
        url_clean = "https://example.com/job/123"
        h1 = url_hash(normalize_url(url_with_tracking))
        h2 = url_hash(normalize_url(url_clean))
        assert h1 == h2


# ── check_rate_limit ──────────────────────────────────────────────────────────

class TestCheckRateLimit:
    def _mock_redis(self, current_count: int | None):
        r = MagicMock()
        r.get.return_value = str(current_count) if current_count is not None else None
        pipe = MagicMock()
        r.pipeline.return_value = pipe
        pipe.incr.return_value = pipe
        pipe.expire.return_value = pipe
        pipe.execute.return_value = [current_count + 1 if current_count else 1, True]
        return r

    # check_rate_limit does a local `import redis as redis_lib` → patch redis.from_url

    def test_within_limit_first_request(self):
        with patch("redis.from_url", return_value=self._mock_redis(None)):
            result = check_rate_limit("user-1", "redis://localhost:6379/0", max_per_hour=10)
        assert result is True

    def test_within_limit_under_max(self):
        with patch("redis.from_url", return_value=self._mock_redis(5)):
            result = check_rate_limit("user-1", "redis://localhost:6379/0", max_per_hour=10)
        assert result is True

    def test_exactly_at_limit_is_blocked(self):
        with patch("redis.from_url", return_value=self._mock_redis(10)):
            result = check_rate_limit("user-1", "redis://localhost:6379/0", max_per_hour=10)
        assert result is False

    def test_over_limit_is_blocked(self):
        with patch("redis.from_url", return_value=self._mock_redis(15)):
            result = check_rate_limit("user-1", "redis://localhost:6379/0", max_per_hour=10)
        assert result is False

    def test_redis_error_fails_open(self):
        with patch("redis.from_url", side_effect=Exception("Redis down")):
            result = check_rate_limit("user-1", "redis://localhost:6379/0", max_per_hour=10)
        assert result is True  # fail open


# ── WorkflowService DB calls ──────────────────────────────────────────────────

class TestWorkflowServiceDb:
    def _ws(self, client=None):
        if client is None:
            client = MagicMock()
        return WorkflowService(client)

    def _table(self, client, data=None, list_data=None):
        """Configure the client mock to return data from .execute()."""
        mock_execute = MagicMock()
        mock_execute.data = list_data if list_data is not None else data

        chain = MagicMock()
        chain.select.return_value = chain
        chain.insert.return_value = chain
        chain.update.return_value = chain
        chain.upsert.return_value = chain
        chain.eq.return_value = chain
        chain.in_.return_value = chain
        chain.order.return_value = chain
        chain.limit.return_value = chain
        chain.single.return_value = chain
        chain.maybe_single.return_value = chain
        chain.execute.return_value = mock_execute
        client.table.return_value = chain
        return chain

    def test_find_job_by_hash_found(self):
        client = MagicMock()
        chain = self._table(client, data={"id": "job-1", "title": "Engineer"})
        ws = self._ws(client)
        result = ws.find_job_by_hash("abc123")
        assert result == {"id": "job-1", "title": "Engineer"}

    def test_find_job_by_hash_not_found(self):
        client = MagicMock()
        # single() raises when no row found — we catch and return None
        chain = self._table(client)
        chain.execute.side_effect = Exception("No rows found")
        ws = self._ws(client)
        result = ws.find_job_by_hash("nonexistent")
        assert result is None

    def test_create_workflow_inserts_record(self):
        client = MagicMock()
        chain = self._table(client, list_data=[{"id": "wf-1", "tracking_id": "trk_abc"}])
        ws = self._ws(client)
        result = ws.create_workflow("trk_abc", "user-1", "idem-key")
        client.table.assert_called_with("user_jobs")
        chain.insert.assert_called_once()
        assert result["tracking_id"] == "trk_abc"

    def test_mark_failed_updates_status(self):
        client = MagicMock()
        chain = self._table(client, list_data=[])
        ws = self._ws(client)
        ws.mark_failed("trk_abc", "LLM timeout")
        chain.update.assert_called_once()
        update_call = chain.update.call_args[0][0]
        assert update_call["status"] == "failed"
        assert "LLM timeout" in update_call["failure_reason"]

    def test_soft_delete_resume(self):
        client = MagicMock()
        chain = self._table(client, list_data=[{"id": "res-1"}])
        ws = self._ws(client)
        result = ws.soft_delete_resume("res-1", "user-1")
        assert result is True
        chain.update.assert_called_once()
        assert chain.update.call_args[0][0]["is_deleted"] is True

    def test_soft_delete_resume_not_found(self):
        client = MagicMock()
        chain = self._table(client, list_data=[])
        ws = self._ws(client)
        result = ws.soft_delete_resume("nonexistent", "user-1")
        assert result is False

    def test_log_event_does_not_raise(self):
        client = MagicMock()
        chain = self._table(client, list_data=[])
        ws = self._ws(client)
        # Should not raise even on error
        ws.log_event("wf-id", "JOB_EXTRACTION_COMPLETED", {"job_id": "job-1"})
        client.table.assert_called_with("workflow_events")

    def test_log_llm_request_does_not_raise(self):
        client = MagicMock()
        chain = self._table(client, list_data=[])
        ws = self._ws(client)
        ws.log_llm_request(
            user_id="user-1",
            user_job_id="wf-1",
            provider="mistral",
            model="mistral-large-latest",
            operation="match_analysis",
            input_tokens=500,
            output_tokens=300,
            latency_ms=1200,
        )
        client.table.assert_called_with("llm_requests")
