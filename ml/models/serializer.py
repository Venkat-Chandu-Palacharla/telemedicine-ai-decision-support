"""Model serialization utilities.

Save and load trained model artifacts using joblib. The neural network is saved
as its own artifact (Keras .keras file) when TensorFlow is available.
"""

from __future__ import annotations

import joblib
from pathlib import Path

from config import MODELS_DIR


def save_sklearn_model(model, name: str, disease_id: str) -> Path:
    """Serialize a scikit-learn style model to joblib."""
    path = MODELS_DIR / f"{disease_id}_{name}.joblib"
    joblib.dump(model, path)
    return path


def load_sklearn_model(disease_id: str, name: str):
    """Load a scikit-learn style model from joblib."""
    path = MODELS_DIR / f"{disease_id}_{name}.joblib"
    return joblib.load(path)


def save_nn_model(model, name: str, disease_id: str) -> Path:
    """Serialize a Keras neural network model."""
    path = MODELS_DIR / f"{disease_id}_{name}.keras"
    model.save(path)
    return path


def save_scaler(scaler, disease_id: str) -> Path:
    """Serialize the fitted scaler for inference-time preprocessing."""
    path = MODELS_DIR / f"{disease_id}_scaler.joblib"
    joblib.dump(scaler, path)
    return path


def save_feature_names(features: list, disease_id: str) -> Path:
    """Save the ordered feature names used during training."""
    path = MODELS_DIR / f"{disease_id}_features.txt"
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(features))
    return path
