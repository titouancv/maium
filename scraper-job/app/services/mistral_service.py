"""
Mistral service for CV generation, optimization, and match scoring.
Uses Mistral's JSON mode to guarantee a parseable output.
"""
import json
import logging
from pathlib import Path

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings
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
    async def _call(self, system_prompt: str, user_content: str) -> dict:
        """Call the Mistral API in JSON mode with exponential retry."""
        payload = {
            "model": settings.MISTRAL_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "max_tokens": 4096,
        }

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(_MISTRAL_API_URL, headers=self._headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            logger.error("Invalid JSON from Mistral: %s", content[:500])
            raise ValueError("Mistral did not return valid JSON") from exc

    async def optimize_cv(self, profile: UserProfile, job: JobOffer) -> OptimizedCV:
        """
        Generate an optimized CV by merging the candidate profile and the job offer.
        """
        user_content = json.dumps(
            {
                "job_offer": {
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "description": job.description,
                    "skills": job.skills,
                    "seniority": job.seniority,
                },
                "candidate_profile": {
                    "first_name": profile.first_name,
                    "last_name": profile.last_name,
                    "location": profile.location,
                    "professional_experiences": profile.professional_experiences,
                    "educational_experiences": profile.educational_experiences,
                    "personal_experiences": profile.personal_experiences,
                    "skills": profile.skills,
                    "projects": profile.projects,
                },
            },
            ensure_ascii=False,
        )

        logger.info(
            "Mistral optimize_cv | user=%s | job=%s @ %s",
            profile.id,
            job.title,
            job.company,
        )

        result = await self._call(_SYSTEM_OPTIMIZE, user_content)

        # Validate via Pydantic
        try:
            return OptimizedCV(**result)
        except Exception as exc:
            logger.error("OptimizedCV validation failed: %s | data: %s", exc, result)
            raise ValueError(f"Invalid Mistral response structure: {exc}") from exc

    async def score_match(self, profile: UserProfile, job: JobOffer) -> MatchScoreResult:
        """
        Compute a detailed compatibility score between a candidate profile and a job offer.
        Returns a MatchScoreResult with an overall score, skill breakdown, strengths and gaps.
        """
        user_content = json.dumps(
            {
                "job_offer": {
                    "title": job.title,
                    "company": job.company,
                    "location": job.location,
                    "description": job.description,
                    "skills": job.skills,
                    "seniority": job.seniority,
                },
                "candidate_profile": {
                    "first_name": profile.first_name,
                    "last_name": profile.last_name,
                    "location": profile.location,
                    "professional_experiences": profile.professional_experiences,
                    "educational_experiences": profile.educational_experiences,
                    "personal_experiences": profile.personal_experiences,
                    "skills": profile.skills,
                    "projects": profile.projects,
                },
            },
            ensure_ascii=False,
        )

        logger.info(
            "Mistral score_match | user=%s | job=%s @ %s",
            profile.id,
            job.title,
            job.company,
        )

        result = await self._call(_SYSTEM_MATCH, user_content)

        # Validate via Pydantic
        try:
            return MatchScoreResult(**result)
        except Exception as exc:
            logger.error("MatchScoreResult validation failed: %s | data: %s", exc, result)
            raise ValueError(f"Invalid Mistral response structure: {exc}") from exc
