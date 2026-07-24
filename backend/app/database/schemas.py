"""
Pydantic v2 schemas for request validation and response serialisation.
"""

from datetime import datetime

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
    """Full response payload for the /predict endpoint."""

    prediction: str = Field(..., examples=["PNEUMONIA"])
    confidence: float = Field(..., ge=0.0, le=100.0, examples=[98.72])
    prediction_id: int = Field(..., examples=[1])
    patient_name: str = Field(..., examples=["John Doe"])
    age: int = Field(..., examples=[45])
    gender: str = Field(..., examples=["Male"])
    image_path: str = Field(..., examples=["uploads/abc123.jpg"])
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionHistoryResponse(BaseModel):
    """Schema for returning a single history record."""

    id: int
    patient_name: str
    age: int
    gender: str
    image_path: str
    prediction: str
    confidence: float
    created_at: datetime

    model_config = {"from_attributes": True}


class DeleteResponse(BaseModel):
    """Confirmation payload after deleting a record."""

    message: str = Field(..., examples=["Prediction record 1 deleted successfully."])
    id: int


class ErrorResponse(BaseModel):
    """Standard error payload."""

    detail: str
