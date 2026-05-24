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
from app.services.ats_service import (
    compute_ats_score,
    optimized_cv_to_text,
    profile_to_text,
)
from app.services.mistral_service import MistralService
from app.services.scraper_service import scrape_job
from app.services.supabase_service import (
    fetch_user_profile,
    get_supabase_client,
    save_optimized_cv,
)

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

    # 4. ATS scores — before (original profile) and after (optimised CV)
    ats_before = compute_ats_score(
        profile_to_text(profile),
        job.description,
        job.skills,
    )
    ats_after = compute_ats_score(
        optimized_cv_to_text(optimized),
        job.description,
        job.skills,
    )
    optimized = optimized.model_copy(
        update={
            "ats_score_before": ats_before,
            "ats_score_after": ats_after,
        }
    )

    # 5. Persist (non-fatal — a Supabase issue must not discard a ready CV)
    logger.info(
        "[CV Optimizer] ATS before=%d → after=%d | saving CV",
        ats_before,
        ats_after,
    )
    try:
        await save_optimized_cv(
            client=client,
            user_id=user_id,
            job_url=job_url,
            company=job.company,
            job_title=job.title,
            ats_score=ats_after,
            generated_cv=optimized.model_dump(),
        )
    except Exception as exc:
        logger.warning(
            "[CV Optimizer] Could not persist CV for user %s (returning result anyway): %s",
            user_id,
            exc,
        )

    return optimized
