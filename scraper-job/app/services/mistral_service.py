"""
Mistral service — CV optimization, match scoring, and job extraction.

Returns (result, LLMCallInfo) so callers can audit token usage without
coupling the LLM layer to the persistence layer.
"""

import hashlib
import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.core.sanitizer import sanitize_for_llm
from app.schemas.cv import MatchScoreResult, OptimizedCV
from app.schemas.job import JobOffer
from app.schemas.profile import UserProfile

logger = logging.getLogger(__name__)
settings = get_settings()

_PROMPTS_DIR = Path(__file__).parent.parent / "prompts"
_SYSTEM_OPTIMIZE = (_PROMPTS_DIR / "optimize_cv.txt").read_text(encoding="utf-8")
_SYSTEM_EXTRACT = (_PROMPTS_DIR / "extract_job.txt").read_text(encoding="utf-8")
_SYSTEM_MATCH = (_PROMPTS_DIR / "match_score.txt").read_text(encoding="utf-8")

_MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions"


@dataclass
class LLMCallInfo:
    input_tokens: int
    output_tokens: int
    latency_ms: int
    prompt_hash: str


class MistralService:
    def __init__(self) -> None:
        self._headers = {
            "Authorization": f"Bearer {settings.MISTRAL_API_KEY}",
            "Content-Type": "application/json",
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def _call(
        self, system_prompt: str, user_content: str
    ) -> tuple[dict, LLMCallInfo]:
        """
        Call Mistral in JSON mode. Returns (parsed_dict, LLMCallInfo).
        user_content must already be sanitized before reaching here.
        """
        payload = {
            "model": settings.MISTRAL_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "response_format": {"type": "json_object"},
            "temperature": settings.MISTRAL_TEMPERATURE,
            "max_tokens": settings.MISTRAL_MAX_TOKENS,
        }

        prompt_hash = hashlib.sha256(
            (system_prompt + user_content).encode()
        ).hexdigest()[:16]

        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                _MISTRAL_API_URL, headers=self._headers, json=payload
            )
            resp.raise_for_status()
            data = resp.json()
        latency_ms = int((time.perf_counter() - t0) * 1000)

        usage = data.get("usage", {})
        call_info = LLMCallInfo(
            input_tokens=usage.get("prompt_tokens", 0),
            output_tokens=usage.get("completion_tokens", 0),
            latency_ms=latency_ms,
            prompt_hash=prompt_hash,
        )

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            logger.error("Unexpected Mistral response: %s | raw: %.500s", exc, str(data))
            raise ValueError("Unexpected response structure from Mistral") from exc

        try:
            return json.loads(content), call_info
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON from Mistral: %.500s", content)
            raise ValueError("Mistral did not return valid JSON") from exc

    def _build_job_payload(self, job: JobOffer) -> dict:
        """Build a safe, sanitized job representation for LLM input."""
        return {
            "title": sanitize_for_llm(job.title, max_chars=200),
            "company": sanitize_for_llm(job.company, max_chars=200),
            "location": job.location,
            "description": sanitize_for_llm(job.description),
            "skills": job.skills[:50],
            "seniority": job.seniority,
        }

    def _build_profile_payload(self, profile: UserProfile) -> dict:
        return {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "location": profile.location,
            "professional_experiences": [
                e.model_dump() for e in profile.professional_experiences
            ],
            "educational_experiences": [
                e.model_dump() for e in profile.educational_experiences
            ],
            "personal_experiences": [
                e.model_dump() for e in profile.personal_experiences
            ],
            "skills": profile.skills,
            "projects": profile.projects,
        }

    async def optimize_cv(
        self, profile: UserProfile, job: JobOffer
    ) -> tuple[OptimizedCV, LLMCallInfo]:
        user_content = json.dumps(
            {
                "job_offer": self._build_job_payload(job),
                "candidate_profile": self._build_profile_payload(profile),
            },
            ensure_ascii=False,
        )

        logger.info(
            "Mistral optimize_cv | user=%s | job=%s @ %s",
            profile.id, job.title, job.company,
        )

        result, call_info = await self._call(_SYSTEM_OPTIMIZE, user_content)

        try:
            return OptimizedCV(**result), call_info
        except Exception as exc:
            logger.error("OptimizedCV validation failed: %s | data: %s", exc, result)
            raise ValueError(f"Invalid Mistral response: {exc}") from exc

    async def score_match(
        self, profile: UserProfile, job: JobOffer
    ) -> tuple[MatchScoreResult, LLMCallInfo]:
        user_content = json.dumps(
            {
                "job_offer": self._build_job_payload(job),
                "candidate_profile": self._build_profile_payload(profile),
            },
            ensure_ascii=False,
        )

        logger.info(
            "Mistral score_match | user=%s | job=%s @ %s",
            profile.id, job.title, job.company,
        )

        result, call_info = await self._call(_SYSTEM_MATCH, user_content)

        try:
            return MatchScoreResult(**result), call_info
        except Exception as exc:
            logger.error("MatchScoreResult validation failed: %s | data: %s", exc, result)
            raise ValueError(f"Invalid Mistral response: {exc}") from exc

    async def extract_job(self, raw_text: str) -> tuple[dict, LLMCallInfo]:
        """Fallback: use LLM to extract structured job data from messy text."""
        safe_text = sanitize_for_llm(raw_text)
        result, call_info = await self._call(_SYSTEM_EXTRACT, safe_text)
        return result, call_info
