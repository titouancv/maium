"""
Schemas mirroring the Supabase `public.users` table.

JSONB fields are typed as list[str | dict] to handle both formats:
- legacy users: list of plain strings  (e.g. skills: ["Angular", "React"])
- standard users: list of objects      (e.g. skills: [{"name": "Angular", "level": "expert"}])
"""

from typing import Any

from pydantic import BaseModel


class UserProfile(BaseModel):
    id: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    pseudo: str | None = None
    location: str | None = None
    phone: str | None = None
    nationality: str | None = None

    # JSONB arrays — accept both string[] and object[] formats
    professional_experiences: list[Any] = []
    educational_experiences: list[Any] = []
    personal_experiences: list[Any] = []
    skills: list[Any] = []
    projects: list[Any] = []
    social_networks: list[Any] = []
    hobbies: list[Any] = []
