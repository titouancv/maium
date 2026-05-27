"""
FastAPI application entry point — v2 async pipeline.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import jobs, resume
from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()
configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Maium — Resume Optimizer API",
    version="2.0.0",
    description="Async job analysis + Mistral AI powered resume optimization",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
app.include_router(jobs.router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "resume-optimizer", "version": "2.0.0"}
