"""
Grad-CAM service for DenseNet121 explainability.

Uses pytorch-grad-cam to generate class activation maps that
highlight the image regions responsible for the model's prediction.
The target layer is the last convolutional block of DenseNet121
(``model.features[-1]``), which captures the highest-level spatial
features before global average pooling.
"""

import time
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn as nn
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from torchvision import transforms

from app.core.config import settings
from app.core.logger import logger


class GradCAMService:
    """
    Generates Grad-CAM heatmaps for a loaded DenseNet121 model.

    Attributes:
        model: The loaded PyTorch model in eval mode.
        device: Device the model runs on.
        target_layer: The convolutional layer to compute Grad-CAM against.
    """

    def __init__(self, model: nn.Module, device: torch.device) -> None:
        self.model = model
        self.device = device
        # DenseNet121 final dense block — best spatial feature resolution
        self.target_layer = model.features[-1]
        logger.info("GradCAMService initialised (target_layer=features[-1])")

    def _prepare_input_tensor(self, image_path: Path) -> torch.Tensor:
        """
        Load and preprocess an image for Grad-CAM computation.

        Applies the same transforms used during inference to ensure
        consistent gradient computation.

        Args:
            image_path: Absolute path to the source image.

        Returns:
            Preprocessed tensor of shape ``(1, 3, 224, 224)``.
        """
        transform = transforms.Compose([
            transforms.Resize((settings.IMAGE_SIZE, settings.IMAGE_SIZE)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])
        image = Image.open(image_path).convert("RGB")
        tensor = transform(image).unsqueeze(0)
        return tensor.to(self.device)

    def generate(
        self,
        image_path: Path,
        predicted_class_idx: int,
    ) -> Optional[np.ndarray]:
        """
        Generate a Grad-CAM activation map for a prediction.

        Args:
            image_path: Absolute path to the original X-ray image.
            predicted_class_idx: Index of the predicted class to explain.

        Returns:
            A 2-D numpy array (H × W) with values in ``[0, 1]`` representing
            the class activation map, or ``None`` if generation fails.
        """
        start = time.perf_counter()

        try:
            input_tensor = self._prepare_input_tensor(image_path)
            targets = [ClassifierOutputTarget(predicted_class_idx)]

            with GradCAM(
                model=self.model,
                target_layers=[self.target_layer],
            ) as cam:
                # grayscale_cam shape: (batch, H, W)
                grayscale_cam = cam(
                    input_tensor=input_tensor,
                    targets=targets,
                )

            # Extract single image from batch
            cam_array: np.ndarray = grayscale_cam[0]

            elapsed = time.perf_counter() - start
            logger.info(
                "Grad-CAM generated in %.3fs (class_idx=%d, shape=%s)",
                elapsed,
                predicted_class_idx,
                cam_array.shape,
            )
            return cam_array

        except Exception as exc:
            elapsed = time.perf_counter() - start
            logger.error(
                "Grad-CAM generation failed after %.3fs: %s",
                elapsed,
                exc,
                exc_info=True,
            )
            return None
