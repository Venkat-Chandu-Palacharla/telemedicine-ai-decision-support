# TeleMedicine AI - Machine Learning Research Pipeline

This directory contains a reproducible research and educational machine-learning pipeline for disease risk prediction. It complements the decision-support backend (`../backend`) and can produce trained statistical models, evaluation, and explainability artifacts when the required datasets are supplied.

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
4. Fit the configured models using the preprocessed training split
5. Select the model with the highest validation ROC-AUC
6. Evaluate candidate models on the held-out test set for reporting; test metrics do not select the model
7. **Explainability** using SHAP (feature importance + SHAP summary plots)
8. Evaluate Platt scaling and isotonic regression for the selected model, reporting Brier score, ECE, and calibration curves

> **Current limitations:** `train.py` does not currently implement five-fold cross-validation or GridSearchCV/RandomizedSearchCV. Model selection uses validation ROC-AUC. The validation split is also used to fit calibration, so calibration selection requires additional care; the test metrics are for final reporting only and must not be used for tuning or model selection. A leakage-safe cross-validation workflow should keep imputation, scaling, SMOTE, and the estimator inside a fold-specific imbalanced-learn pipeline.

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
- The split happens before preprocessing. The imputer and scaler are fit only on training data.
- **SMOTE** is applied only to the training split through an imbalanced-learn pipeline, never to validation/test.
- **Calibration** is fit on the validation split only; the held-out test set is reserved for final, unbiased evaluation.
- There is no cross-validation or hyperparameter search in the current training loop. Validation ROC-AUC selects the model; the test set is used to report model and calibration metrics and must not be used for tuning or model selection.

### Probability Calibration

For the model currently selected by the training workflow, the script fits Platt and isotonic calibrators on validation data and reports their held-out test metrics:
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

> ⚠️ These are offline calibration evaluations, not a selected or production-integrated calibration artifact. The backend does not load these models or calibrators; its heuristic engine returns a deterministic risk score, not a calibrated probability. Do not select a calibration method using the test metrics. See `calibration.py` and `train.py`.

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

The default application backend (`../backend`) uses a transparent heuristic inference engine so the demo runs without training data. Training models here does not integrate them into backend predictions: the inference path does not load model, preprocessing, or calibrator artifacts. Integration requires an explicitly implemented and tested inference service/path that applies the same preprocessing and model/calibrator used during training.

The Framingham dataset configuration is for **10-year coronary heart disease risk**, not hypertension. The backend's separate hypertension endpoint remains a heuristic blood-pressure score and is not trained using the Framingham CHD target.
