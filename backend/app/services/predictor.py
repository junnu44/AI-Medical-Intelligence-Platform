"""
Model predictor service.

Loads the trained DenseNet121 checkpoint once at application startup
and exposes a ``predict`` method for inference.  The model is stored
as a module-level singleton so it is never reloaded per-request.
"""

import time
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models

from backend.app.core.config import settings
from backend.app.core.logger import logger
from backend.app.database.schemas import PredictionResult
from backend.app.services.image_processing import preprocess_image


class Predictor:
    """
    Wraps the DenseNet121 model for single-image inference.

    Attributes:
        model: The loaded PyTorch model in eval mode.
        device: ``torch.device`` the model is running on.
        classes: Ordered list of class labels.
    """

    def __init__(self) -> None:
        self.model: nn.Module | None = None
        self.device: torch.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )
        self.classes: list[str] = settings.CLASSES

    # ── Model Loading ────────────────────────────────────────────────

    def load_model(self) -> None:
        """
        Load the trained model weights from disk.

        This must be called exactly once during application startup
        via the FastAPI ``lifespan`` event.

        Raises:
            FileNotFoundError: If the model file does not exist.
            RuntimeError: If the checkpoint cannot be deserialised.
        """
        model_path: Path = settings.resolved_model_path
        logger.info("Loading model from: %s", model_path)

        if not model_path.exists():
            raise FileNotFoundError(
                f"Model weights not found at {model_path}. "
                "Please train the model first (python training/train.py)."
            )

        start = time.perf_counter()

        # Build architecture identical to training/model.py
        model = models.densenet121(weights=None)
        num_ftrs = model.classifier.in_features
        model.classifier = nn.Linear(num_ftrs, settings.NUM_CLASSES)

        # Load saved weights (handle both raw state_dict and full checkpoint dict)
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)

        if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
            state_dict = checkpoint["state_dict"]
            logger.info(
                "Loaded checkpoint (epoch=%s, best_val_acc=%.4f)",
                checkpoint.get("epoch", "?"),
                checkpoint.get("best_val_acc", 0.0),
            )
        else:
            state_dict = checkpoint

        model.load_state_dict(state_dict)

        model.to(self.device)
        model.eval()

        self.model = model

        elapsed = time.perf_counter() - start
        logger.info(
            "Model loaded successfully on [%s] in %.3f seconds",
            self.device,
            elapsed,
        )

    # ── Inference ────────────────────────────────────────────────────

    def predict(self, image_path: Path) -> PredictionResult:
        """
        Run inference on a single chest X-ray image.

        Args:
            image_path: Absolute path to the uploaded image.

        Returns:
            A ``PredictionResult`` containing the predicted class
            label and confidence percentage.

        Raises:
            RuntimeError: If the model has not been loaded.
            ValueError: If image preprocessing fails.
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded. Call load_model() first.")

        start = time.perf_counter()

        # Preprocess
        input_tensor = preprocess_image(image_path)
        input_tensor = input_tensor.to(self.device)

        # Inference (no gradient tracking)
        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)
            confidence_value, predicted_idx = torch.max(probabilities, dim=1)

        predicted_class: str = self.classes[predicted_idx.item()]
        confidence_pct: float = round(confidence_value.item() * 100, 2)

        elapsed = time.perf_counter() - start
        logger.info(
            "Prediction: %s (%.2f%%) — inference time: %.3fs",
            predicted_class,
            confidence_pct,
            elapsed,
        )

        return PredictionResult(
            prediction=predicted_class,
            confidence=confidence_pct,
        )


# ── Singleton Instance ───────────────────────────────────────────────
predictor = Predictor()
