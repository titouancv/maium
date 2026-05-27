"""
HTML sanitization and anti-prompt-injection defences.

NEVER inject raw external HTML into a prompt.
All job content goes through sanitize_html() then sanitize_for_llm() before any LLM call.
"""

import re

from bs4 import BeautifulSoup

from app.core.config import get_settings

settings = get_settings()

# Tags that carry no meaningful text content and must be removed entirely
_STRIP_TAGS = {
    "script", "style", "noscript", "iframe", "object", "embed",
    "form", "input", "button", "select", "option", "textarea",
    "meta", "link", "head",
}

# Patterns that look like prompt injection attempts
_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions?", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(?:a\s+)?(?:different|new)\s+(?:ai|assistant|model)", re.IGNORECASE),
    re.compile(r"system\s*:\s*\[", re.IGNORECASE),
    re.compile(r"<\|(?:im_start|im_end|system|user|assistant)\|>", re.IGNORECASE),
    re.compile(r"\[INST\]|\[/INST\]", re.IGNORECASE),
    re.compile(r"###\s*(?:System|Human|Assistant)\s*:", re.IGNORECASE),
]


def sanitize_html(html: str) -> str:
    """
    Strip HTML to plain text, removing dangerous / invisible elements.
    Returns clean, readable text safe for LLM input.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Remove entire subtrees for blacklisted tags
    for tag in soup.find_all(_STRIP_TAGS):
        tag.decompose()

    # Remove hidden elements (display:none / visibility:hidden / aria-hidden)
    for tag in soup.find_all(
        style=re.compile(r"display\s*:\s*none|visibility\s*:\s*hidden", re.IGNORECASE)
    ):
        tag.decompose()
    for tag in soup.find_all(attrs={"aria-hidden": "true"}):
        tag.decompose()

    # Remove HTML comments
    for comment in soup.find_all(string=lambda t: isinstance(t, type(t)) and t.startswith("<!--")):
        comment.extract()

    text = soup.get_text(separator="\n")

    # Collapse excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


def sanitize_for_llm(text: str, max_chars: int | None = None) -> str:
    """
    Final safety pass before sending text to an LLM.
    - Removes prompt-injection patterns
    - Truncates to max_chars
    """
    if max_chars is None:
        max_chars = settings.MAX_JOB_DESCRIPTION_CHARS

    for pattern in _INJECTION_PATTERNS:
        text = pattern.sub("[REDACTED]", text)

    if len(text) > max_chars:
        text = text[:max_chars] + "\n[... content truncated for safety ...]"

    return text
