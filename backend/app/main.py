"""
FastAPI application entry point.

Configures the app with lifespan events for model loading and
database initialisation, registers all API routes, sets up
CORS middleware for future frontend integration, and serves
generated Grad-CAM images as static files.
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.core.config import settings
from app.core.logger import logger
from app.database.database import init_db
from app.services.predictor import predictor


# ── Lifespan ─────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.

    On startup:
      1. Initialise database tables.
      2. Ensure the uploads directory exists.
      3. Ensure the generated output directories exist.
      4. Load the trained DenseNet121 model.
      5. Log Gemini API key status.

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

    # 3. Generated output directories (Grad-CAM heatmaps & overlays)
    heatmaps_dir = settings.resolved_generated_folder / "heatmaps"
    overlays_dir = settings.resolved_generated_folder / "overlays"
    heatmaps_dir.mkdir(parents=True, exist_ok=True)
    overlays_dir.mkdir(parents=True, exist_ok=True)
    logger.info("Generated directory: %s", settings.resolved_generated_folder)

    # 4. Model
    predictor.load_model()

    # 5. Gemini status
    gemini_key = settings.GEMINI_API_KEY.strip()
    if gemini_key:
        masked = f"***{gemini_key[-4:]}" if len(gemini_key) >= 4 else "****"
        logger.info("Gemini API key detected: %s", masked)
    else:
        logger.warning("GEMINI_API_KEY not set — AI report generation will be skipped.")

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

# ── Static Files (serve generated Grad-CAM images) ──────────────────

app.mount(
    "/generated",
    StaticFiles(directory=str(settings.resolved_generated_folder)),
    name="generated",
)

# ── Routes ───────────────────────────────────────────────────────────

app.include_router(router)
