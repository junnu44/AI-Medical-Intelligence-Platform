"""
Image preprocessing service.

Applies the exact same transforms used during model evaluation
(Resize → ToTensor → ImageNet normalisation) to ensure inference
consistency with training.
"""

from pathlib import Path

from PIL import Image
from torchvision import transforms

from app.core.config import settings
from app.core.logger import logger


# ── Inference Transform Pipeline ────────────────────────────────────
# Must match training/dataset.py  val_test_transform exactly.
_inference_transform = transforms.Compose([
    transforms.Resize((settings.IMAGE_SIZE, settings.IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


def preprocess_image(image_path: Path):
    """
    Load an image from disk and return a batch-ready tensor.

    Args:
        image_path: Absolute path to the uploaded image file.

    Returns:
        A ``torch.Tensor`` of shape ``(1, 3, 224, 224)`` ready for
        model inference.

    Raises:
        ValueError: If the image cannot be opened or converted.
    """
    try:
        image = Image.open(image_path).convert("RGB")
        tensor = _inference_transform(image)
        # Add batch dimension: (3, 224, 224) → (1, 3, 224, 224)
        batch_tensor = tensor.unsqueeze(0)
        logger.info("Preprocessed image: %s → shape %s", image_path.name, batch_tensor.shape)
        return batch_tensor
    except Exception as exc:
        logger.error("Image preprocessing failed for %s: %s", image_path, exc)
        raise ValueError(f"Could not process image: {exc}") from exc
