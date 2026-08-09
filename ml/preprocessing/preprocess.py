"""Data preprocessing utilities.

Handles:
- Missing value imputation
- Feature scaling
- Categorical encoding
- Class-imbalance handling (SMOTE)
- Train/Validation/Test split
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

from config import TRAIN_RATIO, VAL_RATIO, SEED


def load_dataset(path: str, target_col: str) -> tuple[pd.DataFrame, pd.Series]:
    """Load a CSV dataset and separate features from target."""
    df = pd.read_csv(path)
    if target_col not in df.columns:
        raise ValueError(f"Target column '{target_col}' not found in {path}")
    X = df.drop(columns=[target_col])
    y = df[target_col].astype(int)
    return X, y


def preprocess(
    X: pd.DataFrame,
    y: pd.Series,
    apply_smote: bool = True,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, StandardScaler]:
    """Full preprocessing pipeline returning train/val/test splits.

    Ratios: train = 70%, val = 15%, test = 15%.

    Returns:
        (X_train, X_val, X_test, y_train, y_val, y_test, scaler)
    """
    # 1. Split into train (70%) and temp (30%)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=(1 - TRAIN_RATIO), random_state=SEED, stratify=y,
    )

    # 2. Split temp into val (15%) and test (15%)
    #    val fraction of temp = 0.15 / 0.30 = 0.5
    val_frac_of_temp = VAL_RATIO / (1 - TRAIN_RATIO)
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=(1 - val_frac_of_temp), random_state=SEED, stratify=y_temp,
    )

    # 3. Impute missing values (fit on training only)
    imputer = SimpleImputer(strategy="median")
    X_train = imputer.fit_transform(X_train)
    X_val = imputer.transform(X_val)
    X_test = imputer.transform(X_test)

    # 4. Build a scaling + (optional) SMOTE pipeline.
    #
    # IMPORTANT (no data leakage): The pipeline is fit ONLY on the training
    # split. Both the scaler and SMOTE therefore learn parameters/neighbors
    # exclusively from training data. The validation and test sets are
    # transformed with `transform` (never `fit`), so no information from the
    # held-out sets leaks into preprocessing. This is also cross-validation safe.
    steps = [("scaler", StandardScaler())]
    if apply_smote:
        steps.append(("smote", SMOTE(random_state=SEED)))
    preprocess_pipeline = ImbPipeline(steps)

    X_train, y_train = preprocess_pipeline.fit_resample(X_train, y_train)

    # Extract the fitted scaler for external use (e.g., model export).
    scaler = preprocess_pipeline.named_steps["scaler"]

    # Transform held-out sets using the fitted pipeline (no refit).
    X_val = preprocess_pipeline.transform(X_val)
    X_test = preprocess_pipeline.transform(X_test)

    return X_train, X_val, X_test, y_train, y_val, y_test, scaler


def describe_class_balance(y: pd.Series) -> dict:
    """Return class distribution summary for documentation."""
    counts = y.value_counts()
    total = len(y)
    min_count = counts.min()
    return {
        "total": int(total),
        "class_0": int(counts.get(0, 0)),
        "class_1": int(counts.get(1, 0)),
        "imbalance_ratio": round(counts.max() / min_count, 2) if min_count > 0 else None,
    }
