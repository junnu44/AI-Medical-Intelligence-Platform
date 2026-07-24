import torch.nn as nn
from torchvision import models

def get_model(num_classes: int, freeze_extractor: bool = True) -> nn.Module:
    """
    Initializes a DenseNet121 model with ImageNet pretrained weights.
    Replaces the classifier for our binary classification task.
    """
    model = models.densenet121(weights=models.DenseNet121_Weights.IMAGENET1K_V1)
    
    if freeze_extractor:
        for param in model.parameters():
            param.requires_grad = False
            
    # Replace the classifier
    num_ftrs = model.classifier.in_features
    model.classifier = nn.Linear(num_ftrs, num_classes)
    
    return model
