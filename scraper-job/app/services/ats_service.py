"""
ATS Scoring Engine — hybrid heuristic scoring.

Weights (aligned with spec):
  40% hard skills     — exact skill keyword match
  25% seniority       — experience years vs job level
  20% keyword overlap — frequent job-description terms
  15% bonus signals   — education, location, language indicators
"""

import re
from datetime import datetime


# ─── Public API ───────────────────────────────────────────────────────────────

def compute_ats_score(
    profile_text: str,
    job_description: str,
    job_skills: list[str],
    seniority: str | None = None,
    experience_years: int = 0,
) -> int:
    profile_lower = profile_text.lower()
    job_lower = job_description.lower()

    skill_score = _skill_score(job_skills, profile_lower)
    seniority_score = _seniority_score(seniority, experience_years)
    keyword_score = _keyword_score(job_lower, profile_lower)
    bonus_score = _bonus_score(job_lower, profile_lower)

    final = (
        skill_score * 0.40
        + seniority_score * 0.25
        + keyword_score * 0.20
        + bonus_score * 0.15
    )
    return max(0, min(100, int(final)))


def profile_to_text(profile) -> str:
    parts: list[str] = []
    for exp in profile.professional_experiences:
        parts.append(str(exp))
    for exp in profile.educational_experiences:
        parts.append(str(exp))
    for skill in profile.skills:
        parts.append(skill if isinstance(skill, str) else skill.get("name", ""))
    for proj in profile.projects:
        parts.append(str(proj))
    return " ".join(parts).lower()


def optimized_cv_to_text(optimized) -> str:
    parts: list[str] = [optimized.summary]
    parts.extend(optimized.highlighted_skills)
    for exp in optimized.optimized_experiences:
        parts.append(exp.title)
        parts.append(exp.company)
        parts.extend(exp.bullet_points)
    return " ".join(parts).lower()


def estimate_experience_years(professional_experiences: list) -> int:
    total = 0
    current_year = datetime.now().year
    for exp in professional_experiences:
        start = getattr(exp, "start_period", None) or 0
        end = getattr(exp, "end_period", None) or current_year
        total += max(0, end - start)
    return total


# ─── Scoring components ───────────────────────────────────────────────────────

def _skill_score(job_skills: list[str], profile_lower: str) -> float:
    if not job_skills:
        return 75.0
    hits = sum(1 for s in job_skills if s.lower() in profile_lower)
    return hits / len(job_skills) * 100


def _seniority_score(seniority: str | None, years: int) -> float:
    if not seniority:
        return 75.0

    lvl = seniority.lower()

    if any(k in lvl for k in ("intern", "stage", "apprenti")):
        if years <= 1:
            return 100.0
        if years <= 3:
            return 60.0
        return 30.0  # overqualified

    if any(k in lvl for k in ("junior", "entry", "graduate", "débutant")):
        if years <= 2:
            return 100.0
        if years <= 4:
            return 65.0
        return 35.0

    if any(k in lvl for k in ("senior", "sr.", "principal", "lead", "staff", "expert")):
        if years >= 5:
            return 100.0
        if years >= 3:
            return 65.0
        return 25.0

    if any(k in lvl for k in ("mid", "intermediate", "medior", "confirmé")):
        if 2 <= years <= 6:
            return 100.0
        if years < 2:
            return 50.0
        return 80.0  # slightly overqualified but usually acceptable

    return 75.0


def _keyword_score(job_lower: str, profile_lower: str) -> float:
    words = re.findall(r"\b[a-zA-ZÀ-ÿ]{5,}\b", job_lower)
    freq: dict[str, int] = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1

    _STOP = {
        "experience", "required", "skills", "working", "ability",
        "knowledge", "position", "company", "years", "strong",
        "looking", "please", "apply", "candidate",
    }
    top = [
        w for w in sorted(freq, key=lambda k: -freq[k])
        if w not in _STOP
    ][:20]

    if not top:
        return 50.0
    hits = sum(1 for kw in top if kw in profile_lower)
    return hits / len(top) * 100


def _bonus_score(job_lower: str, profile_lower: str) -> float:
    score = 50.0  # neutral baseline

    _DEGREE_WORDS = ("bachelor", "master", "engineer", "ingénieur", "licence", "degree")
    if any(w in job_lower for w in _DEGREE_WORDS):
        if any(w in profile_lower for w in _DEGREE_WORDS):
            score += 25.0

    _LANG_PAIRS = [("english", "anglais"), ("french", "français"), ("german", "deutsch")]
    for a, b in _LANG_PAIRS:
        if (a in job_lower or b in job_lower) and (a in profile_lower or b in profile_lower):
            score += 12.5

    return min(score, 100.0)
