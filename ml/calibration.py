"""Probability calibration for trained ML classifiers.

Calibrates raw model probabilities using Platt scaling (logistic) and
Isotonic regression, then reports Brier score and Expected Calibration
Error (ECE). The calibration model is fit ONLY on the validation split so
the test split remains untouched (no leakage).
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import brier_score_loss

from config import MODELS_DIR, OUTPUTS_DIR, SEED


def compute_calibration_curve(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> dict:
    """Compute reliability (calibration) curve bins.

    Returns per-bin mean predicted probability and observed frequency.
    """
    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    bin_mid = (bin_edges[:-1] + bin_edges[1:]) / 2.0
    mean_pred = np.zeros(n_bins)
    observed = np.zeros(n_bins)
    counts = np.zeros(n_bins)

    for i in range(n_bins):
        lo, hi = bin_edges[i], bin_edges[i + 1]
        mask = (y_prob >= lo) & (y_prob < hi)
        if i == n_bins - 1:
            mask = (y_prob >= lo) & (y_prob <= hi)
        counts[i] = int(mask.sum())
        if counts[i] > 0:
            mean_pred[i] = y_prob[mask].mean()
            observed[i] = y_true[mask].mean()

    return {
        "bin_midpoints": bin_mid.tolist(),
        "mean_predicted": np.round(mean_pred, 4).tolist(),
        "observed_frequency": np.round(observed, 4).tolist(),
        "bin_counts": counts.astype(int).tolist(),
    }


def expected_calibration_error(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> float:
    """Expected Calibration Error (ECE) — weighted mean absolute gap."""
    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n = len(y_prob)
    for i in range(n_bins):
        lo, hi = bin_edges[i], bin_edges[i + 1]
        mask = (y_prob >= lo) & (y_prob < hi)
        if i == n_bins - 1:
            mask = (y_prob >= lo) & (y_prob <= hi)
        if mask.sum() == 0:
            continue
        mean_pred = y_prob[mask].mean()
        obs = y_true[mask].mean()
        ece += (mask.sum() / n) * abs(obs - mean_pred)
    return float(ece)


def calibrate_and_report(
    model,
    X_val: np.ndarray,
    y_val: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    disease_id: str,
    model_name: str,
) -> dict:
    """Fit calibration on validation, evaluate on test, save report.

    Returns a summary dict with raw vs calibrated Brier and ECE.
    """
    raw_val = model.predict_proba(X_val)[:, 1]
    raw_test = model.predict_proba(X_test)[:, 1]

    # --- Platt scaling (logistic) ---
    platt = LogisticRegression(random_state=SEED)
    platt.fit(raw_val.reshape(-1, 1), y_val)
    platt_test = platt.predict_proba(raw_test.reshape(-1, 1))[:, 1]

    # --- Isotonic regression ---
    iso = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
    iso.fit(raw_val, y_val)
    iso_test = iso.predict(raw_test)

    # --- Metrics on test set ---
    brier_raw = brier_score_loss(y_test, raw_test)
    brier_platt = brier_score_loss(y_test, platt_test)
    brier_iso = brier_score_loss(y_test, iso_test)

    ece_raw = expected_calibration_error(y_test, raw_test)
    ece_platt = expected_calibration_error(y_test, platt_test)
    ece_iso = expected_calibration_error(y_test, iso_test)

    curve_raw = compute_calibration_curve(y_test, raw_test)
    curve_platt = compute_calibration_curve(y_test, platt_test)
    curve_iso = compute_calibration_curve(y_test, iso_test)

    summary = {
        "disease_id": disease_id,
        "model_name": model_name,
        "raw": {"brier": round(brier_raw, 4), "ece": round(ece_raw, 4)},
        "platt": {"brier": round(brier_platt, 4), "ece": round(ece_platt, 4)},
        "isotonic": {"brier": round(brier_iso, 4), "ece": round(ece_iso, 4)},
        "curve_raw": curve_raw,
        "curve_platt": curve_platt,
        "curve_isotonic": curve_iso,
        "status": "calibrated",
    }

    # Save report
    key = f"{disease_id}_{model_name.replace(' ', '_').lower()}"
    report_path = MODELS_DIR / f"{key}_calibration.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=str)

    print(f"  [calibration:{model_name}] Brier raw={brier_raw:.4f} platt={brier_platt:.4f} iso={brier_iso:.4f} | ECE raw={ece_raw:.4f} platt={ece_platt:.4f} iso={ece_iso:.4f}")
    return summary
