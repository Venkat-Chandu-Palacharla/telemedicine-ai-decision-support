# TeleMedicine AI - Machine Learning Research Pipeline

This directory contains a **reproducible, research-grade machine-learning pipeline** for disease risk prediction. It complements the production decision-support backend (`../backend`) and provides the actual trained statistical models, model comparison, evaluation, and explainability artifacts.

> ⚠️ **Important**: This pipeline is for **research and educational purposes**. It is a **decision-support tool**, not a substitute for professional medical diagnosis.

## Models Compared

For each disease, we train and compare:

- Logistic Regression
- Random Forest
- XGBoost
- Neural Network (MLP / small dense network)

## Evaluation Metrics

For each model we report:

- Accuracy
- Precision
- Recall (Sensitivity)
- F1-Score
- ROC-AUC
- Confusion Matrix

## Methodology

1. **Data acquisition** from public, well-cited datasets (UCI, NIDDK, Framingham).
2. **Preprocessing**
   - Handle missing values (imputation)
   - Feature scaling (StandardScaler)
   - Categorical encoding
   - **Class-imbalance handling** using SMOTE (imbalanced-learn)
3. **Train / Validation / Test split** (70/15/15)
4. **Cross-validation** (5-fold) on the training split
5. **Hyperparameter tuning** using GridSearchCV / RandomizedSearchCV
6. **Final evaluation** on the held-out test set
7. **Explainability** using SHAP (feature importance + SHAP summary plots)
8. **Probability calibration** (Platt scaling / Isotonic regression) on the best model, with Brier score, ECE, and calibration curves

### No-Data-Leakage Workflow

The correct, leakage-free ordering is used (see `preprocessing/preprocess.py` and `train.py`):

```
Raw Dataset
     ↓
Train 70% ──────────────┐
                         │
Validation 15%           │
                         ↓
Test 15% ─────── NEVER TOUCHED UNTIL FINAL
```

- The **train/validation/test split happens first**.
- **SMOTE** is applied **only inside an `imblearn.Pipeline`** fit on the **training split** — never before the split, and never on validation/test.
- The **scaler** is fit on training only and applied via `transform` to val/test.
- **Calibration** is fit on the validation split only; the held-out test set is reserved for final, unbiased evaluation.
- The test set does **not** influence preprocessing, hyperparameter tuning, calibration, or model selection.

### Probability Calibration

For the best-performing model, we calibrate raw decision-function probabilities using:
- **Platt Scaling** (sigmoid / logistic)
- **Isotonic Regression**

We then report:
- **Brier Score** (raw vs calibrated)
- **Expected Calibration Error (ECE)** (raw vs calibrated)
- **Calibration (reliability) curve**

```
Prediction
     ↓
XGBoost / RF / LR / NN
     ↓
Probability Calibration (Platt / Isotonic)
     ↓
Calibrated Risk Probability
     ↓
Risk Level
```

> ⚠️ Calibration is an **ML-model operation** and is **not** applied to the default heuristic backend engine (which returns a deterministic risk score, not a calibrated probability). See `calibration.py` and `train.py`.

## Directory Layout

```
ml/
├── requirements.txt
├── README.md
├── run_all.py            # Pipeline orchestrator
├── train.py              # Model training + comparison
├── evaluate.py           # Evaluation (metrics, confusion matrix, ROC)
├── preprocessing/
│   └── preprocess.py     # Cleaning, imputation, scaling, encoding, SMOTE
├── explainability/
│   └── shap_analysis.py  # SHAP feature importance
├── models/
│   └── serializer.py     # Save/load model artifacts
├── config.py             # Dataset paths, hyperparameters
└── outputs/              # Generated artifacts (models, plots, reports)
```

## Usage

```bash
cd ml
pip install -r requirements.txt
python run_all.py
```

Artifacts are written to `ml/outputs/`:
- Trained model `.joblib` files
- `metrics_report.csv` (all model metrics)
- Confusion matrix and ROC-curve plots (`.png`)
- SHAP feature-importance plots
- `*_calibration.json` (Brier, ECE, calibration curves)
- `*_ablation.csv` + `ablation_combined.json` (ablation study)

## Model Leaderboard (illustrative placeholder)

> ⚠️ The numbers below are **illustrative placeholders** to demonstrate the reporting format. They are **not** produced by real training runs. Run `python run_all.py` with the actual datasets to populate `ml/outputs/*_metrics_report.csv`, then update this table.

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|-----|---------|
| Logistic Regression | 82.1% | 80.4% | 78.9% | 79.6% | 0.86 |
| Random Forest | 84.7% | 83.2% | 81.5% | 82.3% | 0.89 |
| XGBoost | 87.3% | 86.1% | 84.8% | 85.4% | 0.92 |
| Neural Network | 85.8% | 84.3% | 82.7% | 83.5% | 0.90 |

## Ablation Study (illustrative)

`ml/ablation.py` isolates the effect of each preprocessing step on performance. The table below is a **template**; real values are written to `ml/outputs/models/*_ablation.csv`.

| Experiment | Features | SMOTE | Scaling | Model | ROC-AUC |
|------------|----------|-------|---------|-------|---------|
| Baseline | Original | ❌ | ❌ | Logistic Regression | — |
| Exp 2 | Original | ✅ | ❌ | Logistic Regression | — |
| Exp 3 | Processed | ✅ | ✅ | Random Forest | — |
| Exp 4 | Processed | ✅ | ✅ | XGBoost | — |

## Integration with Backend

The default application backend (`../backend`) uses a transparent heuristic inference engine so the demo runs without training data. Once you train the models here, you can replace the heuristic engine with the trained `.joblib` artifacts (see `models/serializer.py`) without changing the API contract.
