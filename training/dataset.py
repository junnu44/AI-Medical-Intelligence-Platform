import os
from pathlib import Path
from PIL import Image
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from sklearn.model_selection import train_test_split

class ChestXrayDataset(Dataset):
    def __init__(self, file_paths: list, labels: list, transform=None):
        self.file_paths = file_paths
        self.labels = labels
        self.transform = transform

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        img_path = self.file_paths[idx]
        label = self.labels[idx]
        try:
            image = Image.open(img_path).convert('RGB')
        except Exception as e:
            raise RuntimeError(f"Error loading image {img_path}: {e}")
        
        if self.transform:
            image = self.transform(image)
            
        return image, label

def get_transforms(image_size: int):
    train_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_test_transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_test_transform

def load_data(data_dir: Path):
    file_paths = []
    labels = []
    
    # 0 = NORMAL, 1 = PNEUMONIA
    classes = {"NORMAL": 0, "PNEUMONIA": 1}
    
    if not data_dir.exists():
        return file_paths, labels
        
    for class_name, label in classes.items():
        class_dir = data_dir / class_name
        if not class_dir.exists():
            continue
        for img_name in os.listdir(class_dir):
            if img_name.lower().endswith(('.jpeg', '.jpg', '.png')):
                file_paths.append(class_dir / img_name)
                labels.append(label)
                
    return file_paths, labels

def create_dataloaders(data_dir: Path, image_size: int, batch_size: int, val_split: float, seed: int):
    train_dir = data_dir / "train"
    test_dir = data_dir / "test"
    
    train_paths, train_labels = load_data(train_dir)
    test_paths, test_labels = load_data(test_dir)
    
    if not train_paths:
        raise ValueError(f"No training data found in {train_dir}")
        
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        train_paths, train_labels, test_size=val_split, random_state=seed, stratify=train_labels
    )
    
    train_transform, val_test_transform = get_transforms(image_size)
    
    train_dataset = ChestXrayDataset(train_paths, train_labels, transform=train_transform)
    val_dataset = ChestXrayDataset(val_paths, val_labels, transform=val_test_transform)
    test_dataset = ChestXrayDataset(test_paths, test_labels, transform=val_test_transform)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=True)
    
    return train_loader, val_loader, test_loader
