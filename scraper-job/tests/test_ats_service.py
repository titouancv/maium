"""Tests for app/services/ats_service.py"""

import pytest
from app.services.ats_service import (
    _bonus_score,
    _keyword_score,
    _seniority_score,
    _skill_score,
    compute_ats_score,
    estimate_experience_years,
    optimized_cv_to_text,
    profile_to_text,
)


# ── _skill_score ──────────────────────────────────────────────────────────────

class TestSkillScore:
    def test_all_skills_match(self):
        score = _skill_score(["python", "fastapi", "docker"], "i know python fastapi docker")
        assert score == pytest.approx(100.0)

    def test_no_skills_match(self):
        score = _skill_score(["kubernetes", "rust"], "python javascript")
        assert score == pytest.approx(0.0)

    def test_partial_match(self):
        score = _skill_score(["python", "go", "rust"], "i know python only")
        assert score == pytest.approx(100 / 3)

    def test_empty_skills_list(self):
        score = _skill_score([], "any profile text")
        assert score == pytest.approx(75.0)

    def test_case_insensitive(self):
        score = _skill_score(["Python", "FastAPI"], "i use python and fastapi")
        assert score == pytest.approx(100.0)


# ── _seniority_score ──────────────────────────────────────────────────────────

class TestSeniorityScore:
    def test_junior_with_0_years(self):
        assert _seniority_score("Junior Developer", 0) == pytest.approx(100.0)

    def test_junior_with_1_year(self):
        assert _seniority_score("Entry Level", 1) == pytest.approx(100.0)

    def test_junior_with_5_years(self):
        # Way overqualified
        assert _seniority_score("Graduate Position", 5) == pytest.approx(35.0)

    def test_senior_with_7_years(self):
        assert _seniority_score("Senior Engineer", 7) == pytest.approx(100.0)

    def test_senior_with_1_year(self):
        assert _seniority_score("Sr. Developer", 1) == pytest.approx(25.0)

    def test_senior_with_4_years(self):
        assert _seniority_score("Lead Developer", 4) == pytest.approx(65.0)

    def test_mid_with_3_years(self):
        assert _seniority_score("Mid-level Engineer", 3) == pytest.approx(100.0)

    def test_mid_with_0_years(self):
        assert _seniority_score("intermediate", 0) == pytest.approx(50.0)

    def test_intern(self):
        assert _seniority_score("Stage / Intern", 0) == pytest.approx(100.0)

    def test_unknown_seniority(self):
        assert _seniority_score("Astronaut", 3) == pytest.approx(75.0)

    def test_none_seniority(self):
        assert _seniority_score(None, 5) == pytest.approx(75.0)


# ── _keyword_score ────────────────────────────────────────────────────────────

class TestKeywordScore:
    def test_all_keywords_match(self):
        job = "looking for python django postgresql developer experience"
        profile = "python django postgresql developer experience"
        score = _keyword_score(job, profile)
        assert score > 80.0

    def test_no_keywords_match(self):
        job = "looking for javascript react graphql developer"
        profile = "python machine learning tensorflow pytorch"
        score = _keyword_score(job, profile)
        assert score < 20.0

    def test_empty_job_description(self):
        score = _keyword_score("", "python developer")
        assert score == pytest.approx(50.0)


# ── _bonus_score ──────────────────────────────────────────────────────────────

class TestBonusScore:
    def test_degree_required_and_present(self):
        job = "requires a bachelor degree in computer science"
        profile = "i have a bachelor degree from university"
        score = _bonus_score(job, profile)
        assert score > 50.0

    def test_language_match(self):
        job = "english fluency required"
        profile = "fluent in english and french"
        score = _bonus_score(job, profile)
        assert score > 50.0

    def test_no_special_signals(self):
        job = "build microservices"
        profile = "python developer"
        score = _bonus_score(job, profile)
        assert score == pytest.approx(50.0)


# ── compute_ats_score (integration) ──────────────────────────────────────────

class TestComputeAtsScore:
    def test_perfect_match(self):
        score = compute_ats_score(
            profile_text="python fastapi postgresql docker senior engineer 7 years",
            job_description="looking for senior python fastapi postgresql developer",
            job_skills=["python", "fastapi", "postgresql"],
            seniority="Senior",
            experience_years=7,
        )
        assert score >= 70

    def test_no_match(self):
        score = compute_ats_score(
            profile_text="javascript react nodejs frontend",
            job_description="looking for rust embedded systems engineer",
            job_skills=["rust", "embedded", "c++"],
            seniority="Senior",
            experience_years=2,
        )
        assert score < 40

    def test_score_clamped_0_to_100(self):
        score = compute_ats_score(
            profile_text="",
            job_description="",
            job_skills=[],
        )
        assert 0 <= score <= 100

    def test_score_with_no_skills(self):
        score = compute_ats_score(
            profile_text="python developer experience",
            job_description="python developer",
            job_skills=[],
        )
        assert 0 <= score <= 100


# ── estimate_experience_years ─────────────────────────────────────────────────

class TestEstimateExperienceYears:
    def _make_exp(self, start, end=None):
        class MockExp:
            start_period = start
            end_period = end
        return MockExp()

    def test_single_experience(self):
        exps = [self._make_exp(2020, 2024)]
        assert estimate_experience_years(exps) == 4

    def test_multiple_experiences(self):
        exps = [self._make_exp(2018, 2021), self._make_exp(2021, 2024)]
        assert estimate_experience_years(exps) == 6

    def test_current_experience(self):
        from datetime import datetime
        current_year = datetime.now().year
        exps = [self._make_exp(2022, None)]  # ongoing
        years = estimate_experience_years(exps)
        assert years == current_year - 2022

    def test_empty_experiences(self):
        assert estimate_experience_years([]) == 0

    def test_inverted_dates_clamped_to_zero(self):
        exps = [self._make_exp(2025, 2020)]  # end < start
        assert estimate_experience_years(exps) == 0


# ── profile_to_text / optimized_cv_to_text ────────────────────────────────────

class TestTextExtraction:
    def test_profile_to_text(self):
        class MockExp:
            def __str__(self):
                return "Engineer at Acme 2020-2024"
            type = "professional"
            position = 0

        class MockProfile:
            professional_experiences = [MockExp()]
            educational_experiences = []
            skills = ["Python", "FastAPI"]
            projects = ["https://github.com/example"]

        text = profile_to_text(MockProfile())
        assert "engineer at acme" in text
        assert "python" in text
        assert "fastapi" in text

    def test_optimized_cv_to_text(self):
        class MockExp:
            title = "Software Engineer"
            company = "Acme"
            bullet_points = ["Built APIs", "Led team of 5"]

        class MockCV:
            summary = "Experienced Python developer"
            highlighted_skills = ["Python", "Docker"]
            optimized_experiences = [MockExp()]

        text = optimized_cv_to_text(MockCV())
        assert "experienced python developer" in text
        assert "python" in text
        assert "built apis" in text
