"""
Supabase access service (backend side, service role key).
"""
import logging
import uuid

from supabase import Client, create_client

from app.core.config import get_settings
from app.schemas.profile import UserProfile

logger = logging.getLogger(__name__)
settings = get_settings()


def get_supabase_client() -> Client:
    """Return a Supabase client using the service role key (bypasses RLS)."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


async def fetch_user_profile(user_id: str, client: Client | None = None) -> UserProfile:
    """
    Fetch a user's full profile from Supabase.
    Raises ValueError if the user does not exist.
    """
    if client is None:
        client = get_supabase_client()

    try:
        resp = (
            client.table("users")
            .select(
                "id, email, first_name, last_name, pseudo, location, phone, nationality,"
                "professional_experiences, educational_experiences, personal_experiences,"
                "skills, projects, social_networks, hobbies"
            )
            .eq("id", user_id)
            .single()
            .execute()
        )
    except Exception as exc:
        logger.error("Supabase fetch_user_profile error: %s", exc)
        raise ValueError(f"Could not fetch profile for user {user_id}") from exc

    if not resp.data:
        raise ValueError(f"User {user_id} not found")

    return UserProfile(**resp.data)


async def save_optimized_cv(
    client: Client,
    user_id: str,
    job_url: str,
    company: str,
    job_title: str,
    ats_score: int,
    generated_cv: dict,
) -> str:
    """
    Save an optimized CV to the `optimized_cvs` table.
    Returns the created UUID.
    """
    record_id = str(uuid.uuid4())
    try:
        client.table("optimized_cvs").insert(
            {
                "id": record_id,
                "user_id": user_id,
                "job_url": job_url,
                "company": company,
                "job_title": job_title,
                "ats_score": ats_score,
                "generated_cv": generated_cv,
            }
        ).execute()
    except Exception as exc:
        logger.error("Supabase save_optimized_cv error: %s", exc)
        raise

    return record_id
