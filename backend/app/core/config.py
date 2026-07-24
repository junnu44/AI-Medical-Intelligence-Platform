"""
Application configuration module.

Loads settings from environment variables and .env files
using Pydantic v2 BaseSettings. All paths use pathlib for
cross-platform compatibility.
"""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application-wide configuration loaded from environment variables."""

    # ── Project Paths ────────────────────────────────────────────────
    PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent.parent.parent
    BASE_DIR: Path = Path(__file__).resolve().parent.parent

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./medical_ai.db"

    # ── Model ────────────────────────────────────────────────────────
    MODEL_PATH: str = "models/best_model.pth"

    # ── Uploads ──────────────────────────────────────────────────────
    UPLOAD_FOLDER: str = "backend/app/uploads"

    # ── Limits ───────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10 MB

    # ── Image Settings ───────────────────────────────────────────────
    IMAGE_SIZE: int = 224
    ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png"}

    # ── Model Classes ────────────────────────────────────────────────
    CLASSES: list[str] = ["NORMAL", "PNEUMONIA"]
    NUM_CLASSES: int = 2

    # ── Application Meta ─────────────────────────────────────────────
    APP_TITLE: str = "Advanced AI Medical Intelligence Platform"
    APP_DESCRIPTION: str = (
        "Production-ready API for Chest X-ray Pneumonia Detection "
        "powered by DenseNet121 deep learning."
    )
    APP_VERSION: str = "2.0.0"

    @property
    def resolved_model_path(self) -> Path:
        """Return the absolute path to the model weights file."""
        model_path = Path(self.MODEL_PATH)
        if model_path.is_absolute():
            return model_path
        return self.PROJECT_ROOT / model_path

    @property
    def resolved_upload_folder(self) -> Path:
        """Return the absolute path to the uploads directory."""
        upload_path = Path(self.UPLOAD_FOLDER)
        if upload_path.is_absolute():
            return upload_path
        return self.PROJECT_ROOT / upload_path

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton settings instance
settings = Settings()
