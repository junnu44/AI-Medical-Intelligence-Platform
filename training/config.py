import torch
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "datasets" / "chest_xray"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"

# Create directories if they don't exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Training Hyperparameters
IMAGE_SIZE = 224
BATCH_SIZE = 32
LEARNING_RATE = 0.0001
EPOCHS = 20
PATIENCE = 5
VAL_SPLIT = 0.1
SEED = 42

# Device Configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Classes
CLASSES = ["NORMAL", "PNEUMONIA"]
NUM_CLASSES = len(CLASSES)
