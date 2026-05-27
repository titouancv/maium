from pydantic import BaseModel


class JobParseRequest(BaseModel):
    url: str


class JobOffer(BaseModel):
    title: str
    company: str
    location: str | None = None
    employment_type: str | None = None
    salary: str | None = None
    description: str
    skills: list[str] = []
    seniority: str | None = None
    raw_html: str | None = None  # kept for debugging, never sent to LLMs or API responses


class JobParseResponse(BaseModel):
    title: str
    company: str
    location: str | None = None
    employment_type: str | None = None
    salary: str | None = None
    description: str
    skills: list[str]
    seniority: str | None = None
