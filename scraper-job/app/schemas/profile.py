"""
Schemas mirroring the normalised user profile tables.

user_experiences, user_skills, user_projects, user_social_networks, user_hobbies
are embedded via PostgREST nested selects and surfaced through properties that
preserve the camelCase field names expected by the Mistral prompts.
"""

from pydantic import BaseModel, model_serializer


class ExperienceRecord(BaseModel):
    type: str
    organization: str
    role: str
    start_period: int
    end_period: int | None = None
    description: str | None = None
    website: str | None = None
    location: str | None = None
    position: int = 0

    @model_serializer
    def _to_camel(self) -> dict:
        """Serialize back to camelCase so Mistral prompts stay unchanged."""
        return {
            "organization": self.organization,
            "role": self.role,
            "startPeriod": self.start_period,
            "endPeriod": self.end_period,
            "description": self.description,
            "website": self.website,
            "location": self.location,
        }


class SkillRecord(BaseModel):
    name: str
    position: int = 0


class ProjectRecord(BaseModel):
    url: str
    position: int = 0


class SocialNetworkRecord(BaseModel):
    url: str
    position: int = 0


class HobbyRecord(BaseModel):
    title: str
    description: str = ""
    position: int = 0


class UserProfile(BaseModel):
    id: str
    email: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    pseudo: str | None = None
    location: str | None = None
    phone: str | None = None
    nationality: str | None = None

    user_experiences: list[ExperienceRecord] = []
    user_skills: list[SkillRecord] = []
    user_projects: list[ProjectRecord] = []
    user_social_networks: list[SocialNetworkRecord] = []
    user_hobbies: list[HobbyRecord] = []

    @property
    def professional_experiences(self) -> list[ExperienceRecord]:
        return sorted(
            [e for e in self.user_experiences if e.type == "professional"],
            key=lambda e: e.position,
        )

    @property
    def educational_experiences(self) -> list[ExperienceRecord]:
        return sorted(
            [e for e in self.user_experiences if e.type == "educational"],
            key=lambda e: e.position,
        )

    @property
    def personal_experiences(self) -> list[ExperienceRecord]:
        return sorted(
            [e for e in self.user_experiences if e.type == "personal"],
            key=lambda e: e.position,
        )

    @property
    def skills(self) -> list[str]:
        return [s.name for s in sorted(self.user_skills, key=lambda s: s.position)]

    @property
    def projects(self) -> list[str]:
        return [p.url for p in sorted(self.user_projects, key=lambda p: p.position)]

    @property
    def social_networks(self) -> list[str]:
        return [
            s.url for s in sorted(self.user_social_networks, key=lambda s: s.position)
        ]

    @property
    def hobbies(self) -> list[HobbyRecord]:
        return sorted(self.user_hobbies, key=lambda h: h.position)
