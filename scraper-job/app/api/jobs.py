"""
POST /jobs/parse — Scrape a job offer and return structured data.
"""

import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.job import JobParseRequest, JobParseResponse
from app.services.scraper_service import scrape_job
from app.services.supabase_service import get_supabase_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/parse", response_model=JobParseResponse)
async def parse_job(body: JobParseRequest):
    """
    Scrape a job offer from its URL.
    Supports Greenhouse, Lever, and any generic job board.
    Results are cached for 24 h.
    """
    logger.info("parse_job | url=%s", body.url)

    try:
        client = get_supabase_client()
        job = await scrape_job(body.url, supabase_client=client)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except Exception as exc:
        logger.error("parse_job error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not scrape the job offer. Check the URL or try again.",
        )

    return JobParseResponse(
        title=job.title,
        company=job.company,
        location=job.location,
        description=job.description,
        skills=job.skills,
        seniority=job.seniority,
    )
