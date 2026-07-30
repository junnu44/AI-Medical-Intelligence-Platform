"""
API tests for the Advanced AI Medical Intelligence Platform backend.

Tests cover health endpoints and the predict endpoint (with a mocked
model to avoid requiring the actual model weights during CI).
"""

import io
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.database.database import Base, engine
from app.database.schemas import PredictionResult


# ── Fixtures ─────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def _setup_database():
    """Create tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """
    Return a TestClient with the model loading bypassed.

    We patch predictor.load_model to avoid needing the actual
    model weights file during testing.
    """
    with patch("app.services.predictor.predictor.load_model"):
        from app.main import app
        with TestClient(app) as c:
            yield c


@pytest.fixture()
def dummy_xray_image() -> bytes:
    """Generate a minimal valid JPEG image in memory."""
    img = Image.new("RGB", (224, 224), color=(128, 128, 128))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    buffer.seek(0)
    return buffer.read()


# ── Health Endpoint Tests ────────────────────────────────────────────


class TestHealthEndpoints:
    """Tests for GET / and GET /health."""

    def test_root_returns_welcome(self, client: TestClient):
        """GET / should return a welcome message with version info."""
        response = client.get("/")
        assert response.status_code == 200

        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "docs" in data

    def test_health_returns_healthy(self, client: TestClient):
        """GET /health should return status healthy."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


# ── Predict Endpoint Tests ───────────────────────────────────────────


class TestPredictEndpoint:
    """Tests for POST /predict."""

    def test_predict_success(self, client: TestClient, dummy_xray_image: bytes):
        """POST /predict should return a valid prediction when model is mocked."""
        mock_result = PredictionResult(prediction="PNEUMONIA", confidence=95.42)

        with patch(
            "backend.app.api.routes.predictor.predict",
            return_value=mock_result,
        ):
            response = client.post(
                "/predict",
                data={
                    "patient_name": "Test Patient",
                    "age": "35",
                    "gender": "Male",
                },
                files={"image": ("test_xray.jpg", dummy_xray_image, "image/jpeg")},
            )

        assert response.status_code == 200

        data = response.json()
        assert data["prediction"] == "PNEUMONIA"
        assert data["confidence"] == 95.42
        assert "prediction_id" in data
        assert "created_at" in data
        assert data["patient_name"] == "Test Patient"

    def test_predict_invalid_format(self, client: TestClient):
        """POST /predict should reject non-image file formats."""
        response = client.post(
            "/predict",
            data={
                "patient_name": "Test Patient",
                "age": "30",
                "gender": "Female",
            },
            files={"image": ("document.pdf", b"fake pdf content", "application/pdf")},
        )
        assert response.status_code == 400
        assert "Invalid image format" in response.json()["detail"]

    def test_predict_oversized_image(self, client: TestClient):
        """POST /predict should reject images exceeding the size limit."""
        # Create content larger than 10 MB
        oversized_content = b"\x00" * (10 * 1024 * 1024 + 1)

        response = client.post(
            "/predict",
            data={
                "patient_name": "Test Patient",
                "age": "50",
                "gender": "Male",
            },
            files={"image": ("big.jpg", oversized_content, "image/jpeg")},
        )
        assert response.status_code == 400
        assert "exceeds" in response.json()["detail"]


# ── History Endpoint Tests ───────────────────────────────────────────


class TestHistoryEndpoints:
    """Tests for GET /history, GET /history/{id}, DELETE /history/{id}."""

    def test_get_empty_history(self, client: TestClient):
        """GET /history should return an empty list when no predictions exist."""
        response = client.get("/history")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_history_not_found(self, client: TestClient):
        """GET /history/999 should return 404 for a non-existent record."""
        response = client.get("/history/999")
        assert response.status_code == 404

    def test_delete_history_not_found(self, client: TestClient):
        """DELETE /history/999 should return 404 for a non-existent record."""
        response = client.delete("/history/999")
        assert response.status_code == 404

    def test_predict_then_get_history(self, client: TestClient, dummy_xray_image: bytes):
        """A successful prediction should appear in /history."""
        mock_result = PredictionResult(prediction="NORMAL", confidence=87.15)

        with patch(
            "backend.app.api.routes.predictor.predict",
            return_value=mock_result,
        ):
            pred_response = client.post(
                "/predict",
                data={
                    "patient_name": "History Test",
                    "age": "60",
                    "gender": "Female",
                },
                files={"image": ("xray.jpg", dummy_xray_image, "image/jpeg")},
            )

        assert pred_response.status_code == 200
        pred_id = pred_response.json()["prediction_id"]

        # Verify it appears in full history
        history_response = client.get("/history")
        assert history_response.status_code == 200
        assert len(history_response.json()) == 1

        # Verify individual lookup
        single_response = client.get(f"/history/{pred_id}")
        assert single_response.status_code == 200
        assert single_response.json()["patient_name"] == "History Test"

        # Delete and verify removal
        del_response = client.delete(f"/history/{pred_id}")
        assert del_response.status_code == 200

        verify_response = client.get(f"/history/{pred_id}")
        assert verify_response.status_code == 404
