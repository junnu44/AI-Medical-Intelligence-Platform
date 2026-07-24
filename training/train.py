import time
import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
import config
from dataset import create_dataloaders
from model import get_model
from utils import setup_logger, seed_everything, save_checkpoint, plot_curves

logger = setup_logger()

def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item() * inputs.size(0)
        _, preds = torch.max(outputs, 1)
        correct += torch.sum(preds == labels.data).item()
        total += labels.size(0)
        
    return running_loss / total, correct / total

def validate_epoch(model, loader, criterion, device):
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    
    with torch.no_grad():
        for inputs, labels in loader:
            inputs, labels = inputs.to(device), labels.to(device)
            
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item() * inputs.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)
            
    return running_loss / total, correct / total

def main():
    seed_everything(config.SEED)
    logger.info(f"Using device: {config.DEVICE}")
    
    # Dataloaders
    try:
        train_loader, val_loader, _ = create_dataloaders(
            data_dir=config.DATA_DIR,
            image_size=config.IMAGE_SIZE,
            batch_size=config.BATCH_SIZE,
            val_split=config.VAL_SPLIT,
            seed=config.SEED
        )
    except Exception as e:
        logger.error(f"Failed to create dataloaders: {e}")
        return
        
    # Model
    model = get_model(num_classes=config.NUM_CLASSES, freeze_extractor=True)
    model = model.to(config.DEVICE)
    
    # Loss, Optimizer, Scheduler
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.classifier.parameters(), lr=config.LEARNING_RATE)
    # verbose argument removed as it is deprecated in newer PyTorch versions
    scheduler = ReduceLROnPlateau(optimizer, mode='min', patience=2, factor=0.1)
    
    best_val_acc = 0.0
    epochs_no_improve = 0
    
    history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}
    
    logger.info("Starting training...")
    for epoch in range(config.EPOCHS):
        start_time = time.time()
        
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, config.DEVICE)
        val_loss, val_acc = validate_epoch(model, val_loader, criterion, config.DEVICE)
        
        scheduler.step(val_loss)
        
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_acc'].append(train_acc)
        history['val_acc'].append(val_acc)
        
        epoch_time = time.time() - start_time
        current_lr = optimizer.param_groups[0]['lr']
        
        logger.info(f"Epoch {epoch+1}/{config.EPOCHS} | "
                    f"Train Loss: {train_loss:.4f} | "
                    f"Val Loss: {val_loss:.4f} | "
                    f"Train Acc: {train_acc:.4f} | "
                    f"Val Acc: {val_acc:.4f} | "
                    f"LR: {current_lr:.6f} | "
                    f"Time: {epoch_time:.2f}s")
                    
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            epochs_no_improve = 0
            save_checkpoint({
                'epoch': epoch + 1,
                'state_dict': model.state_dict(),
                'best_val_acc': best_val_acc,
                'optimizer': optimizer.state_dict(),
            }, config.MODELS_DIR / "best_model.pth")
            logger.info("Saved new best model.")
        else:
            epochs_no_improve += 1
            if epochs_no_improve >= config.PATIENCE:
                logger.info(f"Early stopping triggered after {config.PATIENCE} epochs without improvement.")
                break
                
    plot_curves(
        history['train_loss'], history['val_loss'],
        history['train_acc'], history['val_acc'],
        config.REPORTS_DIR
    )
    logger.info("Training completed and curves plotted.")

if __name__ == "__main__":
    main()
