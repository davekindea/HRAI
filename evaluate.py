# Model evaluation script
# Updated import
# Updated import
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score

# Updated function

# Updated function

# Updated function

# Updated function

# Updated function

# Updated function

def evaluate_model(y_true, y_pred):
    """Evaluate model performance"""
    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, average='weighted')
    recall = recall_score(y_true, y_pred, average='weighted')
    return {"accuracy": accuracy, "precision": precision, "recall": recall}

# Last updated: 2025-12-11

# TODO: Review: Review: Review implementation


# Updated: 2025-12-11


# Updated: 2025-12-11










# Updated: 2025-12-11
