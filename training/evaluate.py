import torch
import config
from dataset import create_dataloaders
from model import get_model
from utils import setup_logger, seed_everything, calculate_metrics

logger = setup_logger("evaluate_logger")

def evaluate_model(model, loader, device):
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)
            
            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            
    return all_labels, all_preds

def main():
    seed_everything(config.SEED)
    logger.info(f"Using device: {config.DEVICE}")
    
    try:
        _, _, test_loader = create_dataloaders(
            data_dir=config.DATA_DIR,
            image_size=config.IMAGE_SIZE,
            batch_size=config.BATCH_SIZE,
            val_split=config.VAL_SPLIT,
            seed=config.SEED
        )
    except Exception as e:
        logger.error(f"Failed to create dataloaders: {e}")
        return
        
    model = get_model(num_classes=config.NUM_CLASSES)
    model_path = config.MODELS_DIR / "best_model.pth"
    
    if not model_path.exists():
        logger.error(f"Best model not found at {model_path}")
        return
        
    checkpoint = torch.load(model_path, map_location=config.DEVICE)
    model.load_state_dict(checkpoint['state_dict'])
    model = model.to(config.DEVICE)
    logger.info("Loaded best model checkpoint.")
    
    logger.info("Evaluating on test dataset...")
    y_true, y_pred = evaluate_model(model, test_loader, config.DEVICE)
    
    metrics = calculate_metrics(y_true, y_pred, config.CLASSES, config.REPORTS_DIR)
    
    logger.info("Evaluation completed. Metrics:")
    for k, v in metrics.items():
        logger.info(f"{k}: {v:.4f}")
    logger.info(f"Reports saved in {config.REPORTS_DIR}")

if __name__ == "__main__":
    main()
