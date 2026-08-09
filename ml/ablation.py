"""Ablation study for the TeleMedicine AI ML pipeline.

Isolates the effect of each preprocessing step on model performance. For each
disease we run a small set of controlled experiments and write a CSV report.

Experiments (per disease):
    1. Baseline      : Original features, NO SMOTE, NO scaling — Logistic Regression
    2. SMOTE only    : Original features, SMOTE applied, NO scaling — Logistic Regression
    3. Processed     : original features, SMOTE + scaling — Random Forest
    4. Processed     : original features, SMOTE + scaling — XGBoost

Data-leakage note: SMOTE is always applied ONLY inside an imblearn.Pipeline fit
on the training split, exactly as in the main pipeline. The held-out test set
is transformed (never fitted) and reserved for final evaluation.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from config import DATASETS, MODELS_DIR, SEED, TRAIN_RATIO, VAL_RATIO
from preprocessing.preprocess import load_dataset
from evaluate import evaluate_model

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:  # pragma: no cover
    xgb = None
    HAS_XGB = False


def _single_split(X, y):
    """Return a train/val/test split (70/15/15, stratified) without SMOTE/scaling.

    Returns (X_train, X_val, X_test, y_train, y_val, y_test).
    """
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=(1 - TRAIN_RATIO), random_state=SEED, stratify=y,
    )
    val_frac_of_temp = VAL_RATIO / (1 - TRAIN_RATIO)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=(1 - val_frac_of_temp), random_state=SEED, stratify=y_temp,
    )
    return X_train, X_val, X_test, y_train, y_val, y_test


def _prep_pipeline(apply_smote: bool, apply_scale: bool):
    """Build a leakage-safe scaling + SMOTE pipeline fit on train only."""
    steps = []
    if apply_scale:
        steps.append(("scaler", StandardScaler()))
    if apply_smote:
        steps.append(("smote", SMOTE(random_state=SEED)))
    if not steps:
        # Return a passthrough so we can still call .fit_resample / .transform
        steps.append(("passthrough", "passthrough"))
    return ImbPipeline(steps)


def run_ablation(disease_id: str, cfg: dict) -> list[dict]:
    """Run the ablation experiments for one disease and return a list of result dicts."""
    print(f"\n{'='*70}")
    print(f"ABLATION: {cfg['name']} ({disease_id})")
    print(f"{'='*70}")

    path = cfg["path"]
    if not Path(path).exists():
        print(f"[SKIP] Dataset not found at {path}. Place the CSV and re-run.")
        return []

    X, y = load_dataset(path, cfg["target"])
    X_train, X_val, X_test, y_train, y_val, y_test = _single_split(X, y)

    results = []

    # Baseline: original features, no SMOTE, no scaling, Logistic Regression
    pipe = _prep_pipeline(apply_smote=False, apply_scale=False)
    Xtr, ytr = pipe.fit_resample(X_train, y_train)
    model = LogisticRegression(max_iter=2000, random_state=SEED)
    model.fit(Xtr, ytr)
    y_prob = model.predict_proba(X_test)[:, 1]
    metrics, _ = evaluate_model("Baseline (LR, no SMOTE/scaling)", y_test, y_prob)
    results.append({"experiment": "Baseline", "features": "Original", "smote": False, "scaling": False, **metrics})

    # SMOTE only: original features + SMOTE, no scaling, Logistic Regression
    pipe = _prep_pipeline(apply_smote=True, apply_scale=False)
    Xtr, ytr = pipe.fit_resample(X_train, y_train)
    model = LogisticRegression(max_iter=2000, random_state=SEED)
    model.fit(Xtr, ytr)
    y_prob = model.predict_proba(X_test)[:, 1]
    metrics, _ = evaluate_model("Exp2 (LR, SMOTE)", y_test, y_prob)
    results.append({"experiment": "Exp 2", "features": "Original", "smote": True, "scaling": False, **metrics})

    # Processed: SMOTE + scaling, Random Forest
    pipe = _prep_pipeline(apply_smote=True, apply_scale=True)
    Xtr, ytr = pipe.fit_resample(X_train, y_train)
    model = RandomForestClassifier(n_estimators=200, random_state=SEED, n_jobs=-1)
    model.fit(Xtr, ytr)
    y_prob = model.predict_proba(X_test)[:, 1]
    metrics, _ = evaluate_model("Exp3 (RF, SMOTE+scaling)", y_test, y_prob)
    results.append({"experiment": "Exp 3", "features": "Processed", "smote": True, "scaling": True, **metrics})

    # Processed: SMOTE + scaling, XGBoost (if available)
    if HAS_XGB and xgb is not None:
        pipe = _prep_pipeline(apply_smote=True, apply_scale=True)
        Xtr, ytr = pipe.fit_resample(X_train, y_train)
        model = xgb.XGBClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            use_label_encoder=False, eval_metric="logloss", random_state=SEED,
        )
        model.fit(Xtr, ytr)
        y_prob = model.predict_proba(X_test)[:, 1]
        metrics, _ = evaluate_model("Exp4 (XGB, SMOTE+scaling)", y_test, y_prob)
        results.append({"experiment": "Exp 4", "features": "Processed", "smote": True, "scaling": True, **metrics})

    for r in results:
        print(f"  {r['experiment']:<30} {r}")

    # Write per-disease ablation CSV
    df = pd.DataFrame(results)
    csv_path = MODELS_DIR / f"{disease_id}_ablation.csv"
    df.to_csv(csv_path, index=False)
    print(f"  Ablation report -> {csv_path}")

    return results


def run_all_ablations() -> None:
    """Run ablation for all configured diseases and write a combined report."""
    all_results = {}
    for did, cfg in DATASETS.items():
        all_results[did] = run_ablation(did, cfg)

    combined_path = MODELS_DIR / "ablation_combined.json"
    with open(combined_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"\nCombined ablation report -> {combined_path}")


if __name__ == "__main__":
    import sys
    disease_arg = sys.argv[1] if len(sys.argv) > 1 else None
    if disease_arg:
        if disease_arg not in DATASETS:
            print(f"Unknown disease '{disease_arg}'. Available: {list(DATASETS.keys())}")
            sys.exit(1)
        run_ablation(disease_arg, DATASETS[disease_arg])
    else:
        run_all_ablations()
