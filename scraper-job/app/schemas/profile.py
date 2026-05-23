"""
Schemas mirroring the Supabase `public.users` table.

JSONB fields are typed as list[dict] so the frontend can evolve
their internal shape without breaking the backend.
"""

from pydantic import BaseModel


class UserProfile(BaseModel):
    id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    pseudo: str | None = None
    location: str | None = None
    phone: str | None = None
    nationality: str | None = None

    # JSONB arrays — kept as list[dict] for flexibility
    professional_experiences: list[dict] = []
    educational_experiences: list[dict] = []
    personal_experiences: list[dict] = []
    skills: list[dict] = []
    projects: list[dict] = []
    social_networks: list[dict] = []
    hobbies: list[dict] = []
