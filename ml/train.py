"""Training pipeline for a single disease.

Trains Logistic Regression, Random Forest, XGBoost, and a Neural Network,
evaluates each on the held-out test set, writes metrics and plots, and
serializes model artifacts.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

from config import DATASETS, MODELS_DIR, OUTPUTS_DIR, SEED
from preprocessing.preprocess import load_dataset, preprocess, describe_class_balance
from models.definitions import (
    get_sklearn_models,
    build_nn,
    nn_fit,
    nn_predict_proba,
    HAS_TF,
)
from models.serializer import (
    save_sklearn_model,
    save_nn_model,
    save_scaler,
    save_feature_names,
)
from evaluate import (
    evaluate_model,
    plot_confusion_matrix,
    plot_roc_curve,
    save_metrics_report,
    summarize_results,
)
from calibration import calibrate_and_report
from explainability.shap_analysis import compute_shap


def train_disease(disease_id: str, cfg: dict) -> dict:
    """Run the full training/eval pipeline for one disease."""
    print(f"\n{'='*70}")
    print(f"TRAINING: {cfg['name']} ({disease_id})")
    print(f"Source: {cfg['source']}")
    print(f"{'='*70}")

    path = cfg["path"]
    if not Path(path).exists():
        print(f"[SKIP] Dataset not found at {path}. Place the CSV and re-run.")
        return {"disease_id": disease_id, "status": "skipped", "reason": "dataset missing"}

    X, y = load_dataset(path, cfg["target"])
    print(f"Loaded {X.shape[0]} samples, {X.shape[1]} features")
    print(f"Class balance: {describe_class_balance(y)}")

    # Preprocess (train/val/test + SMOTE + scaling)
    X_train, X_val, X_test, y_train, y_val, y_test, scaler = preprocess(X, y, apply_smote=True)
    print(f"Splits -> train: {len(X_train)}, val: {len(X_val)}, test: {len(X_test)}")

    feature_names = list(X.columns)
    save_feature_names(feature_names, disease_id)
    save_scaler(scaler, disease_id)

    metrics_list = []
    validation_metrics = []
    trained_models = {}

    # --- Classical models ---
    for name, model in get_sklearn_models().items():
        model.fit(X_train, y_train)
        val_prob = model.predict_proba(X_val)[:, 1]
        val_metrics, _ = evaluate_model(name, y_val, val_prob)
        validation_metrics.append(val_metrics)

        y_prob = model.predict_proba(X_test)[:, 1]
        metrics, y_pred = evaluate_model(name, y_test, y_prob)
        metrics_list.append(metrics)

        plot_confusion_matrix(name, disease_id, y_test, y_pred)
        plot_roc_curve(name, disease_id, y_test, y_prob)

        save_sklearn_model(model, name.replace(" ", "_").lower(), disease_id)
        trained_models[name] = model
        print(f"  {name:<22} {metrics}")

    # --- Neural Network ---
    nn_model, nn_kind = build_nn(X_train.shape[1])
    history = nn_fit(nn_model, nn_kind, X_train, y_train, X_val, y_val)
    val_prob = nn_predict_proba(nn_model, nn_kind, X_val)
    val_metrics, _ = evaluate_model("Neural Network", y_val, val_prob)
    validation_metrics.append(val_metrics)

    y_prob = nn_predict_proba(nn_model, nn_kind, X_test)
    metrics, y_pred = evaluate_model("Neural Network", y_test, y_prob)
    metrics_list.append(metrics)
    plot_confusion_matrix("Neural Network", disease_id, y_test, y_pred)
    plot_roc_curve("Neural Network", disease_id, y_test, y_prob)
    if nn_kind == "keras":
        save_nn_model(nn_model, "neural_network", disease_id)
    else:
        save_sklearn_model(nn_model, "neural_network", disease_id)
    trained_models["Neural Network"] = nn_model
    print(f"  {'Neural Network':<22} {metrics}")

    # Save consolidated metrics
    report_path = save_metrics_report(metrics_list, disease_id)
    summary = summarize_results(metrics_list, disease_id, cfg["name"])
    validation_summary = summarize_results(validation_metrics, disease_id, cfg["name"])
    best_name = validation_summary["best_model"]
    best_test_metrics = next(
        metrics for metrics in metrics_list if metrics["model"] == best_name
    )
    summary["best_model"] = best_name
    summary["best_roc_auc"] = float(best_test_metrics["roc_auc"])
    summary["selection_metric"] = "validation_roc_auc"
    summary["selection_roc_auc"] = validation_summary["best_roc_auc"]
    summary["validation_metrics"] = validation_metrics
    summary["report_path"] = report_path
    summary["history"] = None

    # SHAP explainability on the best model
    best_model = trained_models.get(best_name)
    try:
        shap_result = compute_shap(best_model, X_train, disease_id, feature_names)
        summary["shap"] = shap_result
    except Exception as exc:  # pragma: no cover
        print(f"[shap] Could not compute SHAP: {exc}")
        summary["shap"] = {"error": str(exc)}

    # Probability calibration on the best model.
    # Calibration is fit ONLY on the validation split and evaluated on the held-out
    # test set (no leakage). Wrapped in try/except so a calibration failure never
    # aborts the training pipeline. Calibration is an ML-model operation and is
    # NOT applied to the heuristic backend engine.
    if best_model is not None and hasattr(best_model, "predict_proba"):
        try:
            cal_report = calibrate_and_report(
                best_model, X_val, y_val, X_test, y_test, disease_id, best_name
            )
            summary["calibration"] = cal_report
            print(
                f"  [calibration:{best_name}] Brier raw={cal_report['raw']['brier']} "
                f"platt={cal_report['platt']['brier']} iso={cal_report['isotonic']['brier']} "
                f"| ECE raw={cal_report['raw']['ece']} platt={cal_report['platt']['ece']} "
                f"iso={cal_report['isotonic']['ece']}"
            )
        except Exception as exc:  # pragma: no cover
            print(f"[calibration] Could not calibrate {best_name}: {exc}")
            summary["calibration"] = {"error": str(exc)}

    # Save summary JSON
    summary_path = MODELS_DIR / f"{disease_id}_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)

    print(
        f"\nSelected model: {best_name} "
        f"(validation ROC-AUC {summary['selection_roc_auc']:.3f}; "
        f"test ROC-AUC {summary['best_roc_auc']:.3f})"
    )
    print(f"Artifacts saved to {MODELS_DIR}")
    return summary


if __name__ == "__main__":
    disease_arg = sys.argv[1] if len(sys.argv) > 1 else None
    if disease_arg:
        if disease_arg not in DATASETS:
            print(f"Unknown disease '{disease_arg}'. Available: {list(DATASETS.keys())}")
            sys.exit(1)
        train_disease(disease_arg, DATASETS[disease_arg])
    else:
        for did, cfg in DATASETS.items():
            train_disease(did, cfg)
