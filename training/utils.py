import random
import numpy as np
import torch
import logging
import json
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import Dict, Any
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report, confusion_matrix
from PIL import Image

def setup_logger(name: str = "training_logger") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger

def seed_everything(seed: int = 42) -> None:
    random.seed(seed)
    os_seed = seed
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False

def save_checkpoint(state: Dict[str, Any], filepath: Path) -> None:
    torch.save(state, filepath)

def load_checkpoint(filepath: Path, model: torch.nn.Module, optimizer: torch.optim.Optimizer = None) -> tuple:
    checkpoint = torch.load(filepath, map_location=torch.device('cpu'))
    model.load_state_dict(checkpoint['state_dict'])
    if optimizer and 'optimizer' in checkpoint:
        optimizer.load_state_dict(checkpoint['optimizer'])
    return model, optimizer, checkpoint.get('epoch', 0)

def plot_curves(train_losses: list, val_losses: list, train_accs: list, val_accs: list, reports_dir: Path) -> None:
    # Plot Loss
    plt.figure(figsize=(10, 6))
    plt.plot(train_losses, label='Train Loss')
    plt.plot(val_losses, label='Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.title('Training and Validation Loss')
    plt.legend()
    plt.savefig(reports_dir / 'loss_curve.png')
    plt.close()

    # Plot Accuracy
    plt.figure(figsize=(10, 6))
    plt.plot(train_accs, label='Train Accuracy')
    plt.plot(val_accs, label='Validation Accuracy')
    plt.xlabel('Epochs')
    plt.ylabel('Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.legend()
    plt.savefig(reports_dir / 'accuracy_curve.png')
    plt.close()

def calculate_metrics(y_true: list, y_pred: list, classes: list, reports_dir: Path) -> Dict[str, float]:
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, average='weighted', zero_division=0)
    rec = recall_score(y_true, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_true, y_pred, average='weighted', zero_division=0)

    metrics = {
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1_score": float(f1)
    }

    with open(reports_dir / 'metrics.json', 'w') as f:
        json.dump(metrics, f, indent=4)

    # Classification Report
    report = classification_report(y_true, y_pred, target_names=classes)
    with open(reports_dir / 'classification_report.txt', 'w') as f:
        f.write(report)

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=classes, yticklabels=classes)
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title('Confusion Matrix')
    plt.savefig(reports_dir / 'confusion_matrix.png')
    plt.close()

    return metrics

def predict_single_image(image_path: Path, model: torch.nn.Module, transform: Any, device: str) -> int:
    model.eval()
    image = Image.open(image_path).convert('RGB')
    tensor = transform(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(tensor)
        _, preds = torch.max(outputs, 1)
    return preds.item()
