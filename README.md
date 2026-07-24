# Advanced AI Medical Intelligence Platform

## Project Overview
This project focuses on building a reproducible and robust deep learning pipeline for Chest X-ray Pneumonia Detection using Transfer Learning. The model utilizes a PyTorch DenseNet121 architecture, pretrained on ImageNet, to accurately classify chest X-ray images into two classes: `NORMAL` and `PNEUMONIA`. 

This repository contains the complete training pipeline implemented with production-grade engineering principles (type hints, config-driven logic, detailed logging, exception handling, and modular architecture).

## Dataset
The dataset utilized is the [Chest X-Ray Images (Pneumonia)](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia) dataset from Kaggle. 

**Setup Instructions:**
1. Download the dataset from Kaggle.
2. Extract the contents into the `dataset/chest_xray/` folder.

Your `dataset/` directory should look like this:
```
dataset/
└── chest_xray/
    ├── train/
    ├── test/
    └── val/
```
*Note: The pipeline will automatically split 10% off of the `train` set into validation dynamically to form a more representative validation set, leaving the official `test` set completely untouched for final evaluation.*

## Installation
Ensure you have Python 3.8+ installed. 

1. Navigate to the project root directory.
2. (Optional but recommended) Create and activate a Python virtual environment.
3. Install the dependencies:
```bash
pip install -r requirements.txt
```

## Training
To train the DenseNet121 model using the pipeline, simply execute:
```bash
python training/train.py
```
**During training, the pipeline will:**
- Preprocess and augment images to 224x224.
- Print epoch metrics (Loss, Accuracy, Learning Rate, Time per epoch).
- Automatically utilize a GPU if CUDA is available, or fallback to CPU.
- Save `best_model.pth` to the `models/` folder whenever validation accuracy improves.
- Early stop if patience (5 epochs) is reached.
- Save loss and accuracy curves to the `reports/` folder.

## Evaluation
To perform the final evaluation on the official unseen test dataset:
```bash
python training/evaluate.py
```
This script loads `models/best_model.pth` and computes multiple standard ML metrics on the test data. 

### Expected Outputs
At the completion of training and evaluation, the project will automatically produce the following structured artifacts:

- `models/best_model.pth` : The optimal PyTorch model checkpoint.
- `reports/accuracy_curve.png` : Visual training/validation accuracy history.
- `reports/loss_curve.png` : Visual training/validation loss history.
- `reports/confusion_matrix.png` : Heatmap representation of the test evaluation.
- `reports/classification_report.txt` : Detailed precision, recall, and F1 scores.
- `reports/metrics.json` : Fully serialized metrics for further programmatic ingestion.

## Folder Structure
```
Advanced-AI-Medical-Intelligence-Platform/
├── dataset/
│   └── chest_xray/       # Place dataset here
├── training/
│   ├── config.py         # Hyperparameters and paths
│   ├── dataset.py        # Data loading and transforms
│   ├── model.py          # DenseNet121 network architecture
│   ├── train.py          # Execution loop for model training
│   ├── evaluate.py       # Validation logic for final testing
│   └── utils.py          # Logging, curves plotting, and metrics
├── models/               # Saved model files
├── reports/              # Metrics, curves, and evaluation text
├── notebooks/            
├── docs/                 
├── tests/                
├── requirements.txt      # Python dependencies
├── README.md             # Project documentation
└── .gitignore            # Standard ignore logic
```
