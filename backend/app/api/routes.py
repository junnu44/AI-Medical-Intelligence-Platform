"""
API route definitions.

Provides REST endpoints for health checks, chest X-ray prediction
with Grad-CAM explainability and AI report generation,
prediction history management (CRUD), report retrieval, and
Grad-CAM image serving.
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.logger import logger
from backend.app.database.database import get_db
from backend.app.database.models import PredictionHistory
from backend.app.database.schemas import (
    DeleteResponse,
    ErrorResponse,
    GradCAMResponse,
    HealthResponse,
    PredictionHistoryResponse,
    PredictionResponse,
    ReportResponse,
)
from backend.app.services.predictor import predictor
from backend.app.xai.gradcam_service import GradCAMService
from backend.app.xai.heatmap import heatmap_renderer
from backend.app.llm.gemini_service import gemini_service

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
    Accept a chest X-ray image and return the prediction result
    with Grad-CAM explainability and an AI-generated medical report.

    Pipeline:
    1. Validate and save the uploaded image.
    2. Run DenseNet121 inference.
    3. Generate Grad-CAM heatmap and overlay.
    4. Generate AI medical report via Gemini.
    5. Persist all results to the database.
    6. Return the enriched response.
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

    # ── Grad-CAM generation ──────────────────────────────────────
    gradcam_path_str: str | None = None
    overlay_path_str: str | None = None
    gradcam_url: str | None = None
    overlay_url: str | None = None

    try:
        if predictor.model is not None:
            predicted_idx = settings.CLASSES.index(result.prediction)
            gradcam_svc = GradCAMService(
                model=predictor.model,
                device=predictor.device,
            )
            cam_array = gradcam_svc.generate(
                image_path=file_path,
                predicted_class_idx=predicted_idx,
            )

            if cam_array is not None:
                heatmap_path = heatmap_renderer.save_heatmap(cam_array)
                overlay_path = heatmap_renderer.save_overlay(cam_array, file_path)

                gradcam_path_str = str(heatmap_path)
                overlay_path_str = str(overlay_path)

                # Build URL paths for frontend consumption
                gradcam_url = f"/generated/heatmaps/{heatmap_path.name}"
                overlay_url = f"/generated/overlays/{overlay_path.name}"

                logger.info(
                    "Grad-CAM artifacts saved: heatmap=%s, overlay=%s",
                    heatmap_path.name,
                    overlay_path.name,
                )
    except Exception as exc:
        logger.error("Grad-CAM pipeline failed: %s", exc, exc_info=True)

    # ── Gemini report generation ─────────────────────────────────
    llm_report: str | None = None

    try:
        report = gemini_service.generate_report(
            prediction=result.prediction,
            confidence=result.confidence,
            patient_name=patient_name,
            age=age,
            gender=gender,
        )
        llm_report = report if report else "report_generation_failed"
    except Exception as exc:
        logger.error("Gemini pipeline failed: %s", exc, exc_info=True)
        llm_report = "report_generation_failed"

    # ── Persist to database ──────────────────────────────────────
    record = PredictionHistory(
        patient_name=patient_name,
        age=age,
        gender=gender,
        image_path=str(file_path),
        prediction=result.prediction,
        confidence=result.confidence,
        gradcam_path=gradcam_path_str,
        overlay_path=overlay_path_str,
        llm_report=llm_report,
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
        gradcam_image=gradcam_url,
        overlay_image=overlay_url,
        llm_report=llm_report,
        created_at=record.created_at,
    )


# ── Report Endpoint ──────────────────────────────────────────────────


@router.get(
    "/report/{record_id}",
    summary="Get AI-Generated Medical Report",
    response_model=ReportResponse,
    responses={404: {"model": ErrorResponse}},
    tags=["Reports"],
)
def get_report(
    record_id: int,
    db: Session = Depends(get_db),
) -> ReportResponse:
    """
    Return the stored AI-generated medical report for a prediction.

    Returns the report text along with prediction metadata.
    If the prediction exists but no report was generated, the
    ``llm_report`` field will be ``None`` or ``"report_generation_failed"``.
    """
    logger.info("GET /report/%d", record_id)
    record = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.id == record_id)
        .first()
    )
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction record {record_id} not found.",
        )

    return ReportResponse(
        prediction_id=record.id,
        patient_name=record.patient_name,
        prediction=record.prediction,
        confidence=record.confidence,
        llm_report=record.llm_report,
        created_at=record.created_at,
    )


# ── Grad-CAM Endpoint ───────────────────────────────────────────────


@router.get(
    "/gradcam/{record_id}",
    summary="Get Grad-CAM Overlay Image",
    responses={
        200: {"content": {"image/png": {}}, "description": "Grad-CAM overlay image."},
        404: {"model": ErrorResponse},
    },
    tags=["Explainability"],
)
def get_gradcam(
    record_id: int,
    db: Session = Depends(get_db),
):
    """
    Return the Grad-CAM overlay image file for a prediction.

    Serves the overlay PNG directly as a file download. Returns 404
    if the prediction record or overlay file does not exist.
    """
    logger.info("GET /gradcam/%d", record_id)
    record = (
        db.query(PredictionHistory)
        .filter(PredictionHistory.id == record_id)
        .first()
    )
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction record {record_id} not found.",
        )

    if not record.overlay_path:
        raise HTTPException(
            status_code=404,
            detail=f"No Grad-CAM overlay available for prediction {record_id}.",
        )

    overlay_file = Path(record.overlay_path)
    if not overlay_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Overlay file not found on disk for prediction {record_id}.",
        )

    return FileResponse(
        path=str(overlay_file),
        media_type="image/png",
        filename=f"gradcam_overlay_{record_id}.png",
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
