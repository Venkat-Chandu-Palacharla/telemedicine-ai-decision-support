"""Model evaluation utilities.

Computes accuracy, precision, recall, F1, ROC-AUC, and generates
confusion-matrix and ROC-curve plots. Writes a consolidated metrics report CSV.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
)

from config import OUTPUTS_DIR, MODELS_DIR


def evaluate_model(name: str, y_true, y_prob):
    """Compute evaluation metrics given true labels and predicted probabilities."""
    threshold = 0.5
    y_pred = (np.asarray(y_prob) >= threshold).astype(int)

    metrics = {
        "model": name,
        "accuracy": round(accuracy_score(y_true, y_pred), 4),
        "precision": round(precision_score(y_true, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_true, y_pred, zero_division=0), 4),
        "f1": round(f1_score(y_true, y_pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_true, y_prob), 4),
    }
    return metrics, y_pred


def plot_confusion_matrix(name: str, disease_id: str, y_true, y_pred) -> str:
    """Generate and save a confusion matrix heatmap."""
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", cbar=False, ax=ax)
    ax.set_title(f"Confusion Matrix - {name}")
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    path = OUTPUTS_DIR / f"{disease_id}_confusion_{name.replace(' ', '_').lower()}.png"
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
    return str(path)


def plot_roc_curve(name: str, disease_id: str, y_true, y_prob) -> str:
    """Generate and save an ROC curve plot."""
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(fpr, tpr, label=f"ROC (AUC = {auc:.3f})", lw=2)
    ax.plot([0, 1], [0, 1], "k--", label="Random")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title(f"ROC Curve - {name}")
    ax.legend(loc="lower right")
    ax.grid(alpha=0.3)
    path = OUTPUTS_DIR / f"{disease_id}_roc_{name.replace(' ', '_').lower()}.png"
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)
    return str(path)


def save_metrics_report(metrics_list: list[dict], disease_id: str) -> str:
    """Save all model metrics to a CSV report."""
    df = pd.DataFrame(metrics_list)
    path = MODELS_DIR / f"{disease_id}_metrics_report.csv"
    df.to_csv(path, index=False)
    return str(path)


def summarize_results(metrics_list: list[dict], disease_id: str, disease_name: str) -> dict:
    """Return a summary dict with the best model and formatted table."""
    if not metrics_list:
        return {}
    df = pd.DataFrame(metrics_list)
    best_row = df.loc[df["roc_auc"].idxmax()]
    return {
        "disease_id": disease_id,
        "disease_name": disease_name,
        "best_model": best_row["model"],
        "best_roc_auc": float(best_row["roc_auc"]),
        "table": df.to_dict(orient="records"),
    }
