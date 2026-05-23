"""
Shared interface for all scrapers.
"""
from abc import ABC, abstractmethod

from app.schemas.job import JobOffer


class BaseScraper(ABC):
    @abstractmethod
    async def scrape(self, url: str) -> JobOffer:
        """Scrape a job offer from the given URL and return a structured JobOffer."""
        raise NotImplementedError
