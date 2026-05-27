"""
Structured JSON logging.
Every record includes tracking_id and worker_name when available via contextvars.
"""

import logging
import sys
from contextvars import ContextVar

from app.core.config import get_settings

# Context variables — set per-request / per-task for automatic inclusion in logs
current_tracking_id: ContextVar[str] = ContextVar("tracking_id", default="-")
current_user_id: ContextVar[str] = ContextVar("user_id", default="-")
current_worker: ContextVar[str] = ContextVar("worker_name", default="-")


class ContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.tracking_id = current_tracking_id.get()
        record.user_id = current_user_id.get()
        record.worker_name = current_worker.get()
        return True


def configure_logging() -> None:
    settings = get_settings()
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    fmt = (
        "%(asctime)s | %(levelname)-8s | %(name)s"
        " | trk=%(tracking_id)s uid=%(user_id)s worker=%(worker_name)s"
        " | %(message)s"
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt=fmt, datefmt="%Y-%m-%dT%H:%M:%S"))
    handler.addFilter(ContextFilter())

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers.clear()
    root.addHandler(handler)

    for noisy in ("httpx", "playwright", "asyncio", "urllib3", "hpack"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
