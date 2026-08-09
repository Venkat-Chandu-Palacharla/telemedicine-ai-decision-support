"""SHAP explainability analysis.

Computes SHAP feature importance for the best-performing model and generates
summary + bar plots. SHAP must be installed (see requirements.txt).
"""

from __future__ import annotations

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from config import OUTPUTS_DIR


def compute_shap(model, X_train, disease_id: str, feature_names=None, model_kind="sklearn"):
    """Compute SHAP values and generate importance plots.

    Args:
        model: Trained model.
        X_train: Training features (numpy array) used as SHAP background.
        disease_id: Disease identifier for output filenames.
        feature_names: Optional list of feature names.
        model_kind: "sklearn" for tree/linear explainers (uses TreeExplainer).

    Returns:
        dict with summary plot path and top-feature importance.
    """
    try:
        import shap
    except ImportError as exc:  # pragma: no cover
        print("[shap] SHAP not installed. Skipping explainability. pip install shap")
        return {"error": "SHAP not installed"}

    if model_kind == "sklearn" and hasattr(model, "predict"):
        # Use TreeExplainer for tree ensembles, LinearExplainer for linear
        try:
            explainer = shap.TreeExplainer(model, X_train)
        except Exception:
            explainer = shap.Explainer(model, X_train)
    else:
        explainer = shap.Explainer(model, X_train)

    shap_values = explainer(X_train[:100] if len(X_train) > 100 else X_train)

    # Summary plot
    summary_path = OUTPUTS_DIR / f"{disease_id}_shap_summary.png"
    fig = plt.figure()
    shap.summary_plot(
        shap_values,
        X_train[:100] if len(X_train) > 100 else X_train,
        feature_names=feature_names,
        show=False,
    )
    fig.savefig(summary_path, dpi=120, bbox_inches="tight")
    plt.close(fig)

    # Bar plot (mean |SHAP|)
    bar_path = OUTPUTS_DIR / f"{disease_id}_shap_bar.png"
    fig2 = plt.figure()
    shap.summary_plot(
        shap_values,
        X_train[:100] if len(X_train) > 100 else X_train,
        feature_names=feature_names,
        plot_type="bar",
        show=False,
    )
    fig2.savefig(bar_path, dpi=120, bbox_inches="tight")
    plt.close(fig2)

    return {
        "summary_plot": str(summary_path),
        "bar_plot": str(bar_path),
        "features": feature_names or [],
    }
