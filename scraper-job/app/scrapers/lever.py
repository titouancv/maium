"""
Lever scraper using the public API.
URL patterns:
    https://jobs.lever.co/<company>/<job_id>
    https://jobs.lever.co/<company>/<job_id>/apply
"""

import logging
import re

import httpx

from app.scrapers.base import BaseScraper
from app.scrapers.greenhouse import (
    _extract_skills_from_text,
    _infer_seniority,
    _strip_html,
)
from app.schemas.job import JobOffer

logger = logging.getLogger(__name__)

_LEVER_RE = re.compile(r"jobs\.lever\.co/([^/]+)/([a-f0-9\-]{36})", re.IGNORECASE)


class LeverScraper(BaseScraper):
    async def scrape(self, url: str) -> JobOffer:
        m = _LEVER_RE.search(url)
        if not m:
            raise ValueError(f"Could not extract company/job_id from: {url}")

        company_slug, job_id = m.group(1), m.group(2)
        api_url = f"https://api.lever.co/v0/postings/{company_slug}/{job_id}"

        logger.info("Lever API: %s", api_url)

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(api_url)
            resp.raise_for_status()
            data = resp.json()

        title: str = data.get("text", "")
        company: str = data.get("company", company_slug)

        # Location can be in categories.location or categories.city
        categories = data.get("categories", {})
        location: str | None = categories.get("location") or categories.get("city")

        # Description: prefer descriptionPlain (already clean text),
        # then fall back to sections (lists) + additional (HTML stripped)
        description_plain: str = data.get("descriptionPlain", "").strip()
        lists = data.get("lists", [])
        additional = data.get("additional", "")

        if description_plain:
            description = description_plain
        else:
            description_parts: list[str] = []
            for section in lists:
                header = section.get("text", "")
                body = _strip_html(section.get("content", ""))
                if header:
                    description_parts.append(f"\n## {header}\n{body}")
                else:
                    description_parts.append(body)
            if additional:
                description_parts.append(_strip_html(additional))
            description = "\n".join(description_parts).strip()
        skills = _extract_skills_from_text(description)

        return JobOffer(
            title=title,
            company=company,
            location=location,
            description=description,
            skills=skills,
            seniority=_infer_seniority(title),
        )
