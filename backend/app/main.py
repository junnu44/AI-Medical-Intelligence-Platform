"""
FastAPI application entry point.

Configures the app with lifespan events for model loading and
database initialisation, registers all API routes, and sets up
CORS middleware for future frontend integration.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router
from backend.app.core.config import settings
from backend.app.core.logger import logger
from backend.app.database.database import init_db
from backend.app.services.predictor import predictor


# ── Lifespan ─────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    On startup:
      1. Initialise database tables.
      2. Ensure the uploads directory exists.
      3. Load the trained DenseNet121 model.

    On shutdown:
      Log the shutdown event.
    """
    logger.info("=" * 60)
    logger.info("Starting %s v%s", settings.APP_TITLE, settings.APP_VERSION)
    logger.info("=" * 60)

    # 1. Database
    init_db()

    # 2. Uploads directory
    settings.resolved_upload_folder.mkdir(parents=True, exist_ok=True)
    logger.info("Uploads directory: %s", settings.resolved_upload_folder)

    # 3. Model
    predictor.load_model()

    logger.info("Application startup complete.")
    yield

    logger.info("Application shutdown.")


# ── App Factory ──────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ── CORS (allows future frontend integration) ───────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────

app.include_router(router)
