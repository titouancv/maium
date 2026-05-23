"""
Generic scraper using Playwright + selectolax / BeautifulSoup.
Used for all unrecognised job boards (LinkedIn, Welcome to the Jungle, etc.)
"""
import logging
import re

from selectolax.parser import HTMLParser

from app.scrapers.base import BaseScraper
from app.scrapers.greenhouse import _extract_skills_from_text, _infer_seniority
from app.core.config import get_settings
from app.schemas.job import JobOffer

logger = logging.getLogger(__name__)
settings = get_settings()

# CSS selectors tried in priority order
_TITLE_SELECTORS = [
    "h1.job-title", "h1[data-testid='jobTitle']", "h1", ".job-title",
    "[class*='title']",
]
_COMPANY_SELECTORS = [
    "[data-testid='companyName']", ".company-name", "[class*='company']",
    "meta[property='og:site_name']",
]
_DESCRIPTION_SELECTORS = [
    "[data-testid='jobDescriptionText']", ".job-description",
    "[class*='description']", "article", "main",
]

# Detect prompt injection attempts in job descriptions
_INJECTION_RE = re.compile(
    r"(ignore\s+(previous|all)\s+instructions?|system\s*:)",
    re.IGNORECASE,
)


async def _get_html(url: str) -> str:
    """Launch a headless Chromium browser and return the fully rendered HTML."""
    from playwright.async_api import async_playwright  # lazy import

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = await context.new_page()
        try:
            await page.goto(url, timeout=settings.SCRAPER_TIMEOUT_MS, wait_until="networkidle")
            html = await page.content()
        finally:
            await browser.close()
    return html


def _first_text(tree: HTMLParser, selectors: list[str]) -> str:
    for sel in selectors:
        nodes = tree.css(sel)
        if nodes:
            text = nodes[0].text(deep=True, strip=True)
            if text:
                return text
    return ""


def _sanitize(text: str) -> str:
    """
    - Strip residual HTML tags
    - Neutralise prompt injection attempts
    - Truncate to 8 000 chars to avoid overflowing the Mistral context window
    """
    text = re.sub(r"<[^>]+>", " ", text)
    text = _INJECTION_RE.sub("[REDACTED]", text)
    text = re.sub(r"\s{3,}", "\n\n", text).strip()
    return text[:8_000]


class GenericScraper(BaseScraper):
    async def scrape(self, url: str) -> JobOffer:
        logger.info("Generic Playwright scrape: %s", url)
        html = await _get_html(url)

        tree = HTMLParser(html)

        # Remove noise before extraction
        for tag in tree.css("script, style, noscript, header, footer, nav"):
            tag.decompose()

        title = _first_text(tree, _TITLE_SELECTORS) or "Unknown title"
        company = (
            _first_text(tree, _COMPANY_SELECTORS)
            or _extract_og_meta(tree, "og:site_name")
            or "Unknown company"
        )

        description_raw = _first_text(tree, _DESCRIPTION_SELECTORS)
        if not description_raw:
            # Fallback: use the entire body text
            body = tree.css_first("body")
            description_raw = body.text(deep=True, strip=True) if body else ""

        description = _sanitize(description_raw)
        skills = _extract_skills_from_text(description)

        # Try common location selectors
        location: str | None = None
        for sel in ["[data-testid='location']", ".location", "[class*='location']"]:
            node = tree.css_first(sel)
            if node:
                location = node.text(deep=True, strip=True)
                break

        return JobOffer(
            title=title,
            company=company,
            location=location,
            description=description,
            skills=skills,
            seniority=_infer_seniority(title),
            raw_html=html[:5_000],  # truncated for debugging purposes
        )


def _extract_og_meta(tree: HTMLParser, property_name: str) -> str | None:
    node = tree.css_first(f"meta[property='{property_name}']")
    if node:
        return node.attributes.get("content")
    return None
