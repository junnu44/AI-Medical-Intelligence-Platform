"""
SQLAlchemy database engine and session management.

Supports SQLite (default) and PostgreSQL via the DATABASE_URL
environment variable. Uses dependency injection for FastAPI routes.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from backend.app.core.config import settings
from backend.app.core.logger import logger


def _build_engine_args(url: str) -> dict:
    """
    Return engine keyword arguments appropriate for the database backend.

    SQLite requires ``check_same_thread=False`` when used with FastAPI's
    threaded request handling.
    """
    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return {"connect_args": connect_args}


engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    **_build_engine_args(settings.DATABASE_URL),
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


def init_db() -> None:
    """Create all tables that do not yet exist."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialised (engine=%s)", engine.url)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that yields a database session and ensures cleanup.

    Yields:
        A SQLAlchemy Session scoped to the request lifecycle.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
