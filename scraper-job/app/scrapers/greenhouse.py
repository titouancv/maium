"""
Greenhouse scraper using the public boards-api.greenhouse.io API.
URL patterns:
    https://boards.greenhouse.io/<company>/jobs/<job_id>
    https://job-boards.greenhouse.io/<company>/jobs/<job_id>
"""

import logging
import re

import httpx
from bs4 import BeautifulSoup

from app.scrapers.base import BaseScraper
from app.schemas.job import JobOffer

logger = logging.getLogger(__name__)

# Regex to extract company slug + job id from a Greenhouse URL
_GH_RE = re.compile(r"greenhouse\.io/([^/]+)/jobs/(\d+)", re.IGNORECASE)


class GreenhouseScraper(BaseScraper):
    async def scrape(self, url: str) -> JobOffer:
        m = _GH_RE.search(url)
        if not m:
            raise ValueError(f"Could not extract company/job_id from: {url}")

        company_slug, job_id = m.group(1), m.group(2)
        api_url = (
            f"https://boards-api.greenhouse.io/v1/boards/{company_slug}/jobs/{job_id}"
        )

        logger.info("Greenhouse API: %s", api_url)

        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.get(api_url)
            resp.raise_for_status()
            data = resp.json()

        title: str = data.get("title", "")
        company: str = data.get("company", {}).get("name", company_slug)
        location: str | None = (
            data.get("location", {}).get("name") if data.get("location") else None
        )

        # Description is HTML — strip it to plain text
        raw_html: str = data.get("content", "")
        description = _strip_html(raw_html)

        skills = _extract_skills_from_text(description)

        return JobOffer(
            title=title,
            company=company,
            location=location,
            description=description,
            skills=skills,
            seniority=_infer_seniority(title),
        )


def _strip_html(html: str) -> str:
    """Strip HTML tags while preserving text structure."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    # Add newlines around block-level elements
    for tag in soup.find_all(["li", "p", "h1", "h2", "h3", "h4"]):
        tag.insert_before("\n")
    text = soup.get_text(separator=" ")
    # Collapse multiple whitespace/newlines
    return re.sub(r"\n{3,}", "\n\n", re.sub(r" {2,}", " ", text)).strip()


def _extract_skills_from_text(text: str) -> list[str]:
    """Simple heuristic skill extraction (can be replaced by a Mistral call)."""
    common_skills = [
        "Python",
        "JavaScript",
        "TypeScript",
        "React",
        "Next.js",
        "Vue",
        "Angular",
        "Node.js",
        "FastAPI",
        "Django",
        "Flask",
        "SQL",
        "PostgreSQL",
        "MySQL",
        "MongoDB",
        "Redis",
        "Docker",
        "Kubernetes",
        "AWS",
        "GCP",
        "Azure",
        "GraphQL",
        "REST",
        "Git",
        "CI/CD",
        "Java",
        "Go",
        "Rust",
        "C++",
        "C#",
        "Swift",
        "Kotlin",
        "PHP",
        "Ruby",
        "Rails",
        "Scala",
        "Spark",
        "Kafka",
        "Terraform",
        "Ansible",
        "Linux",
        "Machine Learning",
        "Deep Learning",
        "PyTorch",
        "TensorFlow",
        "LLM",
        "RAG",
        "Figma",
    ]
    text_lower = text.lower()
    return [s for s in common_skills if s.lower() in text_lower]


def _infer_seniority(title: str) -> str | None:
    title_lower = title.lower()
    if any(w in title_lower for w in ["senior", "sr.", "lead", "principal", "staff"]):
        return "Senior"
    if any(w in title_lower for w in ["junior", "jr.", "entry"]):
        return "Junior"
    if any(w in title_lower for w in ["mid", "intermediate"]):
        return "Mid"
    if any(w in title_lower for w in ["intern", "trainee"]):
        return "Internship"
    return None
