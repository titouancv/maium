"""
ATS Scoring Engine — V1: heuristic keyword/skill matching.
Complements the score computed by Mistral with a local verification pass.
"""
import re


def compute_ats_score(profile_text: str, job_description: str, job_skills: list[str]) -> int:
    """
    Compute an ATS score (0-100) by comparing:
    - Job skills found in the candidate's profile
    - Frequent keywords from the job description found in the profile
    """
    profile_lower = profile_text.lower()
    job_lower = job_description.lower()

    # --- Skill matching ---
    skill_hits = sum(1 for s in job_skills if s.lower() in profile_lower)
    skill_score = (skill_hits / len(job_skills) * 100) if job_skills else 0

    # --- Keyword matching (words > 4 chars, frequent in the job description) ---
    words = re.findall(r"\b[a-zA-ZÀ-ÿ]{5,}\b", job_lower)
    word_freq: dict[str, int] = {}
    for w in words:
        word_freq[w] = word_freq.get(w, 0) + 1

    # Top 20 most frequent meaningful keywords
    top_keywords = sorted(word_freq, key=lambda k: -word_freq[k])[:20]
    kw_hits = sum(1 for kw in top_keywords if kw in profile_lower)
    kw_score = (kw_hits / len(top_keywords) * 100) if top_keywords else 0

    # Weighted blend: 60% skills, 40% keywords
    final = int(skill_score * 0.6 + kw_score * 0.4)
    return max(0, min(100, final))


def profile_to_text(profile) -> str:
    """Flatten a UserProfile into plain text for ATS scoring."""
    parts: list[str] = []

    for exp in profile.professional_experiences:
        parts.append(str(exp))
    for exp in profile.educational_experiences:
        parts.append(str(exp))
    for skill in profile.skills:
        if isinstance(skill, dict):
            parts.append(skill.get("name", "") or skill.get("label", ""))
        else:
            parts.append(str(skill))
    for proj in profile.projects:
        parts.append(str(proj))

    return " ".join(parts).lower()


def optimized_cv_to_text(optimized) -> str:
    """Flatten an OptimizedCV into plain text for ATS scoring."""
    parts: list[str] = [optimized.summary]

    parts.extend(optimized.highlighted_skills)

    for exp in optimized.optimized_experiences:
        parts.append(exp.title)
        parts.append(exp.company)
        parts.extend(exp.bullet_points)

    return " ".join(parts).lower()
