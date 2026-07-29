"""
Heatmap rendering and overlay generation.

Converts raw Grad-CAM activation maps into coloured heatmap images
and blended overlay images suitable for medical review. All output
files use UUID filenames to prevent collisions and path injection.
"""

import uuid
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from backend.app.core.config import settings
from backend.app.core.logger import logger


class HeatmapRenderer:
    """
    Renders Grad-CAM arrays as standalone heatmap images and
    blended overlays on top of the original X-ray.
    """

    @staticmethod
    def _ensure_directory(directory: Path) -> Path:
        """Create the target directory if it does not exist."""
        directory.mkdir(parents=True, exist_ok=True)
        return directory

    def save_heatmap(
        self,
        cam_array: np.ndarray,
        output_dir: Path | None = None,
    ) -> Path:
        """
        Save a standalone coloured heatmap image.

        Applies the JET colourmap to the raw Grad-CAM array and writes
        a UUID-named PNG to the ``generated/heatmaps/`` directory.

        Args:
            cam_array: 2-D numpy array in ``[0, 1]`` from Grad-CAM.
            output_dir: Override directory (defaults to settings).

        Returns:
            Absolute path to the saved heatmap image.
        """
        if output_dir is None:
            output_dir = settings.resolved_generated_folder / "heatmaps"
        self._ensure_directory(output_dir)

        # Scale to 0-255 and apply JET colourmap
        heatmap_uint8 = np.uint8(255 * cam_array)
        heatmap_coloured = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        # OpenCV uses BGR → convert to RGB for PIL
        heatmap_rgb = cv2.cvtColor(heatmap_coloured, cv2.COLOR_BGR2RGB)

        filename = f"{uuid.uuid4().hex}.png"
        output_path = output_dir / filename

        image = Image.fromarray(heatmap_rgb)
        image.save(output_path, format="PNG")

        logger.info("Heatmap saved: %s", output_path)
        return output_path

    def save_overlay(
        self,
        cam_array: np.ndarray,
        original_image_path: Path,
        output_dir: Path | None = None,
        alpha: float = 0.5,
    ) -> Path:
        """
        Save a blended overlay of the heatmap on the original image.

        Resizes the original X-ray to match the CAM dimensions, applies
        the JET colourmap, and alpha-blends the two images together.

        Args:
            cam_array: 2-D numpy array in ``[0, 1]`` from Grad-CAM.
            original_image_path: Path to the uploaded X-ray image.
            output_dir: Override directory (defaults to settings).
            alpha: Blend weight for the heatmap (0 = image only, 1 = heatmap only).

        Returns:
            Absolute path to the saved overlay image.
        """
        if output_dir is None:
            output_dir = settings.resolved_generated_folder / "overlays"
        self._ensure_directory(output_dir)

        # Load and resize the original image to CAM dimensions
        original = Image.open(original_image_path).convert("RGB")
        cam_h, cam_w = cam_array.shape[:2]
        original_resized = original.resize((cam_w, cam_h), Image.LANCZOS)
        original_np = np.array(original_resized, dtype=np.float32) / 255.0

        # Create coloured heatmap in float [0, 1]
        heatmap_uint8 = np.uint8(255 * cam_array)
        heatmap_coloured = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
        heatmap_rgb = cv2.cvtColor(heatmap_coloured, cv2.COLOR_BGR2RGB)
        heatmap_float = heatmap_rgb.astype(np.float32) / 255.0

        # Alpha blend: overlay = alpha * heatmap + (1 - alpha) * original
        blended = alpha * heatmap_float + (1.0 - alpha) * original_np
        blended = np.clip(blended, 0.0, 1.0)
        blended_uint8 = np.uint8(255 * blended)

        filename = f"{uuid.uuid4().hex}.png"
        output_path = output_dir / filename

        image = Image.fromarray(blended_uint8)
        image.save(output_path, format="PNG")

        logger.info("Overlay saved: %s", output_path)
        return output_path


# Singleton instance
heatmap_renderer = HeatmapRenderer()
