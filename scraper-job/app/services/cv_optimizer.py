"""
Main orchestrator for the CV optimization pipeline.

Flow:
    1. scrape_job(url)
    2. fetch_user_profile(user_id)
    3. MistralService.optimize_cv(profile, job)
    4. ATS scoring (blend Mistral + local)
    5. save_optimized_cv → Supabase
    6. Return OptimizedCV
"""
import logging

from app.schemas.cv import OptimizedCV
from app.schemas.job import JobOffer
from app.schemas.profile import UserProfile
from app.services.ats_service import compute_ats_score, profile_to_text
from app.services.mistral_service import MistralService
from app.services.scraper_service import scrape_job
from app.services.supabase_service import fetch_user_profile, get_supabase_client, save_optimized_cv

logger = logging.getLogger(__name__)


async def run_cv_optimization(user_id: str, job_url: str) -> OptimizedCV:
    """
    Run the full CV optimization pipeline.
    Designed to be called from a Celery worker.
    """
    client = get_supabase_client()

    # 1. Scrape the job offer (with cache)
    logger.info("[CV Optimizer] Scraping %s", job_url)
    job: JobOffer = await scrape_job(job_url, supabase_client=client)

    # 2. Fetch user profile
    logger.info("[CV Optimizer] Fetching profile for user %s", user_id)
    profile: UserProfile = await fetch_user_profile(user_id, client=client)

    # 3. Generate the optimized CV via Mistral
    mistral = MistralService()
    optimized: OptimizedCV = await mistral.optimize_cv(profile, job)

    # 4. Local ATS check (sanity check on the Mistral score)
    local_score = compute_ats_score(
        profile_to_text(profile),
        job.description,
        job.skills,
    )
    # Blend: 70% Mistral score (richer context) + 30% local score (verifiable)
    blended_score = int(optimized.ats_score * 0.7 + local_score * 0.3)
    optimized = optimized.model_copy(update={"ats_score": blended_score})

    # 5. Persist
    logger.info("[CV Optimizer] Saving optimized CV (ATS score: %d)", blended_score)
    await save_optimized_cv(
        client=client,
        user_id=user_id,
        job_url=job_url,
        company=job.company,
        job_title=job.title,
        ats_score=blended_score,
        generated_cv=optimized.model_dump(),
    )

    return optimized
