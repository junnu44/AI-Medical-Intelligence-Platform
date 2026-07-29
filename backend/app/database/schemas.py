"""
Pydantic v2 schemas for request validation and response serialisation.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ── Response Schemas ─────────────────────────────────────────────────


class HealthResponse(BaseModel):
    """Response payload for the health-check endpoint."""

    status: str = Field(default="healthy", examples=["healthy"])


class PredictionResult(BaseModel):
    """Core prediction output returned by the model service."""

    prediction: str = Field(..., examples=["PNEUMONIA"])
    confidence: float = Field(..., ge=0.0, le=100.0, examples=[98.72])


class PredictionResponse(BaseModel):
    """Full response payload for the /predict endpoint (Day 3 enriched)."""

    prediction: str = Field(..., examples=["PNEUMONIA"])
    confidence: float = Field(..., ge=0.0, le=100.0, examples=[98.72])
    prediction_id: int = Field(..., examples=[1])
    patient_name: str = Field(..., examples=["John Doe"])
    age: int = Field(..., examples=[45])
    gender: str = Field(..., examples=["Male"])
    image_path: str = Field(..., examples=["uploads/abc123.jpg"])
    gradcam_image: Optional[str] = Field(
        default=None,
        description="URL path to the Grad-CAM heatmap image.",
        examples=["/generated/heatmaps/abc123.png"],
    )
    overlay_image: Optional[str] = Field(
        default=None,
        description="URL path to the Grad-CAM overlay image.",
        examples=["/generated/overlays/abc123.png"],
    )
    llm_report: Optional[str] = Field(
        default=None,
        description="AI-generated medical report or 'report_generation_failed'.",
        examples=["## 1. Summary\n..."],
    )
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionHistoryResponse(BaseModel):
    """Schema for returning a single history record (Day 3 enriched)."""

    id: int
    patient_name: str
    age: int
    gender: str
    image_path: str
    prediction: str
    confidence: float
    gradcam_path: Optional[str] = None
    overlay_path: Optional[str] = None
    llm_report: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReportResponse(BaseModel):
    """Response payload for the GET /report/{id} endpoint."""

    prediction_id: int = Field(..., examples=[1])
    patient_name: str = Field(..., examples=["John Doe"])
    prediction: str = Field(..., examples=["PNEUMONIA"])
    confidence: float = Field(..., ge=0.0, le=100.0, examples=[98.72])
    llm_report: Optional[str] = Field(
        default=None,
        description="AI-generated medical report text.",
    )
    created_at: datetime

    model_config = {"from_attributes": True}


class GradCAMResponse(BaseModel):
    """Metadata response for the GET /gradcam/{id} endpoint."""

    prediction_id: int = Field(..., examples=[1])
    prediction: str = Field(..., examples=["PNEUMONIA"])
    confidence: float = Field(..., ge=0.0, le=100.0, examples=[98.72])
    gradcam_path: Optional[str] = None
    overlay_path: Optional[str] = None

    model_config = {"from_attributes": True}


class DeleteResponse(BaseModel):
    """Confirmation payload after deleting a record."""

    message: str = Field(..., examples=["Prediction record 1 deleted successfully."])
    id: int


class ErrorResponse(BaseModel):
    """Standard error payload."""

    detail: str
