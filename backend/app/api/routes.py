"""
API route definitions.

Provides REST endpoints for health checks, chest X-ray prediction,
and prediction history management (CRUD).
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.logger import logger
from backend.app.database.database import get_db
from backend.app.database.models import PredictionHistory
from backend.app.database.schemas import (
    DeleteResponse,
    ErrorResponse,
    HealthResponse,
    PredictionHistoryResponse,
    PredictionResponse,
)
from backend.app.services.predictor import predictor

router = APIRouter()


# ── Health Endpoints ─────────────────────────────────────────────────


@router.get(
    "/",
    summary="Root",
    response_model=dict,
    tags=["Health"],
)
def root() -> dict:
    """Return a welcome health message."""
    return {
        "message": "Welcome to the Advanced AI Medical Intelligence Platform",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@router.get(
    "/health",
    summary="Health Check",
    response_model=HealthResponse,
    tags=["Health"],
)
def health_check() -> HealthResponse:
    """Return the current health status of the API."""
    return HealthResponse(status="healthy")


# ── Prediction ───────────────────────────────────────────────────────


@router.post(
    "/predict",
    summary="Predict Chest X-ray",
    response_model=PredictionResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    tags=["Prediction"],
)
async def predict(
    patient_name: str = Form(..., description="Patient full name"),
    age: int = Form(..., ge=0, le=150, description="Patient age"),
    gender: str = Form(..., description="Patient gender"),
    image: UploadFile = File(..., description="Chest X-ray image (jpg/jpeg/png)"),
    db: Session = Depends(get_db),
) -> PredictionResponse:
    """
    Accept a chest X-ray image and return the prediction result.

    Validates the uploaded image, stores it with a UUID filename,
    runs DenseNet121 inference, persists the result to the database,
    and returns the prediction with confidence score.
    """
    logger.info(
        "POST /predict — patient=%s, age=%d, gender=%s, file=%s",
        patient_name,
        age,
        gender,
        image.filename,
    )

    # ── Validate file extension ──────────────────────────────────
    file_ext = Path(image.filename or "").suffix.lower()
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid image format '{file_ext}'. "
                f"Accepted formats: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
            ),
        )

    # ── Validate file size ───────────────────────────────────────
    contents = await image.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Image size ({len(contents) / (1024 * 1024):.1f} MB) exceeds "
                f"maximum allowed size ({settings.MAX_UPLOAD_SIZE / (1024 * 1024):.0f} MB)."
            ),
        )

    # ── Save uploaded image ──────────────────────────────────────
    upload_dir: Path = settings.resolved_upload_folder
    upload_dir.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = upload_dir / unique_filename

    file_path.write_bytes(contents)
    logger.info("Image saved: %s (%d bytes)", file_path, len(contents))

    # ── Run inference ────────────────────────────────────────────
    try:
        result = predictor.predict(file_path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    # ── Persist to database ──────────────────────────────────────
    record = PredictionHistory(
        patient_name=patient_name,
        age=age,
        gender=gender,
        image_path=str(file_path),
        prediction=result.prediction,
        confidence=result.confidence,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    logger.info("Prediction saved: id=%d", record.id)

    return PredictionResponse(
        prediction=result.prediction,
        confidence=result.confidence,
        prediction_id=record.id,
        patient_name=record.patient_name,
        age=record.age,
        gender=record.gender,
        image_path=record.image_path,
        created_at=record.created_at,
    )


# ── History Endpoints ────────────────────────────────────────────────


@router.get(
    "/history",
    summary="Get All Predictions",
    response_model=list[PredictionHistoryResponse],
    tags=["History"],
)
def get_all_history(db: Session = Depends(get_db)) -> list[PredictionHistoryResponse]:
    """Return all previous prediction records ordered by most recent first."""
    logger.info("GET /history")
    records = (
        db.query(PredictionHistory)
        .order_by(PredictionHistory.created_at.desc())
        .all()
    )
    return [PredictionHistoryResponse.model_validate(r) for r in records]


@router.get(
    "/history/{record_id}",
    summary="Get Single Prediction",
    response_model=PredictionHistoryResponse,
    responses={404: {"model": ErrorResponse}},
    tags=["History"],
)
def get_history_by_id(
    record_id: int,
    db: Session = Depends(get_db),
) -> PredictionHistoryResponse:
    """Return a single prediction record by its ID."""
    logger.info("GET /history/%d", record_id)
    record = db.query(PredictionHistory).filter(PredictionHistory.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail=f"Prediction record {record_id} not found.")
    return PredictionHistoryResponse.model_validate(record)


@router.delete(
    "/history/{record_id}",
    summary="Delete Prediction",
    response_model=DeleteResponse,
    responses={404: {"model": ErrorResponse}},
    tags=["History"],
)
def delete_history(
    record_id: int,
    db: Session = Depends(get_db),
) -> DeleteResponse:
    """Delete a prediction record by its ID."""
    logger.info("DELETE /history/%d", record_id)
    record = db.query(PredictionHistory).filter(PredictionHistory.id == record_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail=f"Prediction record {record_id} not found.")

    db.delete(record)
    db.commit()
    logger.info("Deleted prediction record id=%d", record_id)

    return DeleteResponse(
        message=f"Prediction record {record_id} deleted successfully.",
        id=record_id,
    )
