from pydantic import BaseModel


class JobParseRequest(BaseModel):
    # Using str instead of HttpUrl to handle non-standard Lever/Greenhouse URLs
    url: str


class JobOffer(BaseModel):
    title: str
    company: str
    location: str | None = None
    description: str
    skills: list[str] = []
    seniority: str | None = None
    raw_html: str | None = None  # kept for debugging, not exposed in API responses

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Senior Frontend Engineer",
                "company": "OpenAI",
                "location": "San Francisco, CA",
                "description": "We are looking for...",
                "skills": ["React", "TypeScript", "GraphQL"],
                "seniority": "Senior",
            }
        }


class JobParseResponse(BaseModel):
    title: str
    company: str
    location: str | None = None
    description: str
    skills: list[str]
    seniority: str | None = None
