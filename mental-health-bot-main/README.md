# TeleMedicine AI - Decision-Support Health Prediction System

> ⚠️ **Important Disclaimer**: This system is a **decision-support tool** and is **not a substitute for professional medical diagnosis**. All outputs are **deterministic risk scores** (heuristic estimates) and must be verified by qualified healthcare professionals before any clinical decisions are made. The default heuristic engine does **not** produce a statistically calibrated probability.

## Overview

An end-to-end AI healthcare decision-support platform for disease risk prediction, comprising:

- A **React + Vite** web dashboard (patient / doctor / admin)
- An **Express (TypeScript) REST API** with a transparent heuristic inference engine, JWT authentication, role-based access control, and Swagger/OpenAPI documentation
- A **reproducible Python machine-learning pipeline** (Logistic Regression, Random Forest, XGBoost, Neural Network) with full evaluation and SHAP explainability

Supported diseases: **Heart Disease**, **Diabetes**, **Parkinson's Disease**, and **Hypertension**.

## Architecture

```
                 ┌──────────────────────────────────────────────┐
                 │                 TeleMedicine AI              │
                 └──────────────────────────────────────────────┘
        ┌────────────────────────┴────────────────────────┐
        │                                                 │
 Production / Demo (works offline)              Research ML (needs data)
        │                                                 │
Heuristic Inference Engine (Express API)      Python Training Pipeline
        │                                                 │
 Risk Score + Confidence + RBAC + Swagger      LR / RF / XGBoost / NN + Calibration
        │                                                 │
        │                                     Evaluation + SHAP + ROC + CM
        └────────────────────────┬────────────────────────┘
                                 │
                      Web Dashboard (React/Vite)
```

- The **Express API** runs out-of-the-box with an in-memory store and a deterministic heuristic inference engine — no training data or external API keys required.
- The **Python pipeline** (`ml/`) produces real trained models, model comparison, and explainability artifacts. Once trained, the heuristic engine can be swapped for the exported `.joblib` models **without changing the API contract**.

## Repository Layout

```
├── backend/                 # Express + TypeScript REST API (decision-support)
│   ├── src/
│   │   ├── engine/          # Heuristic inference engine
│   │   ├── middleware/      # JWT auth, RBAC, error handling, validation
│   │   ├── models/          # Disease config & risk thresholds
│   │   ├── routes/          # health, auth, predict endpoints
│   │   ├── schemas/         # Zod request validation
│   │   ├── swagger/         # OpenAPI spec → /api-docs
│   │   └── app.ts / server.ts
│   └── tests/               # Vitest + Supertest API tests
├── ml/                      # Python ML research pipeline
│   ├── preprocessing/       # Cleaning, imputation, scaling, encoding, SMOTE
│   ├── models/              # Model definitions & serialization
│   ├── explainability/      # SHAP analysis
│   ├── train.py / evaluate.py / run_all.py
│   └── config.py
├── mental-health-bot-main/  # React + Vite frontend
├── datasets/                # Dataset documentation
├── docker-compose.yml       # frontend + api + postgres + mongo
└── .github/workflows/ci.yml # CI (frontend, backend, ML)
```

## ML System

### Models Compared (per disease)
For each disease, four model families are trained and compared on the **same** train/validation/test split:

| Model | Notes |
|-------|-------|
| Logistic Regression | Linear baseline, highly interpretable |
| Random Forest | Robust, handles mixed features, low overfitting |
| XGBoost | Gradient boosting, strong on tabular data |
| Neural Network | Small MLP / dense network for non-linear patterns |

### Evaluation Metrics
- **Accuracy**, **Precision**, **Recall**, **F1-Score**
- **ROC-AUC** (discrimination)
- **Confusion Matrix** (visualized as a heatmap)
- **5-fold Cross-Validation** on the training split

### Validation Methodology
A proper **70 / 15 / 15 train-validation-test** split is used:
1. **Train** — fit the model
2. **Validation** — hyperparameter tuning (GridSearchCV / RandomizedSearchCV)
3. **Test** — final, held-out evaluation (never used for tuning)

### Class-Imbalance Handling
- **SMOTE** oversampling applied to the training split only
- Stratified splitting preserves class proportions
- Confusion matrices and ROC curves reveal class-specific performance

### Explainability (XAI)
- **SHAP** (SHapley Additive exPlanations) computed on the best-performing model
- Feature-importance bar/summary plots
- Local and global interpretation of each prediction

### Risk Output (not a binary Yes/No)
Instead of a binary diagnosis, the system produces a **deterministic risk score**:
- 🟢 **Low Risk** (0–40%)
- 🟡 **Moderate Risk** (40–70%)
- 🔴 **High Risk** (70–100%)

> ⚠️ **Terminology note**: The default heuristic engine produces a **deterministic risk score**, **not** a statistically calibrated probability. In other words, a score of `0.82` does **not** mean "82 out of 100 similar patients will develop this disease." It is a rule-based, reproducible estimate for decision-support. Once a trained, calibrated ML model is integrated (see `ml/`), the output can legitimately be labeled a calibrated probability.

Each result also includes a **confidence score** (based on parameter completeness) and **factor-level contributions** (positive / negative / neutral).

### Calibration Pipeline (trained ML models only)
Calibration is an **ML-model operation** and is **not** applied to the heuristic engine. When trained models are used, probabilities are calibrated before risk-tiering:

```
Prediction
     ↓
XGBoost / RF / LR / NN
     ↓
Probability Calibration (Platt Scaling / Isotonic Regression)
     ↓
Calibrated Risk Probability
     ↓
Risk Level
```

Calibration is fit **only on the validation split** and evaluated on the held-out test set. We report the **Brier Score** and **Expected Calibration Error (ECE)** alongside a **calibration (reliability) curve**. See `ml/calibration.py`.

### No-Data-Leakage Methodology
The correct, leakage-free workflow is used (see `ml/preprocessing/preprocess.py`):

```
Raw Dataset
     ↓
Train 70% ──────────────┐
                         │
Validation 15%           │
                         ↓
Test 15% ─────── NEVER TOUCHED UNTIL FINAL
```

- **SMOTE** is applied **only inside the training pipeline** (an `imblearn.Pipeline`), never before the train/val/test split. This prevents synthetic samples from leaking into validation/test.
- The **scaler** is fit on the training split only and applied via `transform` to val/test.
- Calibration is fit on validation only; the test set is reserved for final, unbiased evaluation.

## REST API (backend/)

The API is self-documented via **Swagger/OpenAPI** at `http://localhost:8080/api-docs`.

### Endpoints
| Method | Path | Description | Access |
|--------|------|-------------|--------|
| `GET` | `/api/health` | Health check | Public |
| `POST` | `/api/auth/login` | Issue JWT | Public |
| `GET` | `/api/admin/only` | RBAC demo | Admin |
| `POST` | `/api/predict` | Generic prediction | Authenticated |
| `POST` | `/api/predict/heart` | Heart disease | Authenticated |
| `POST` | `/api/predict/diabetes` | Diabetes | Authenticated |
| `POST` | `/api/predict/hypertension` | Hypertension | Authenticated |
| `POST` | `/api/predict/parkinsons` | Parkinson's screening | Authenticated |
| `POST` | `/api/predict/mental-health` | Wellbeing screening | Authenticated |
| `GET` | `/api-docs.json` | OpenAPI spec | Public |

### Authentication & RBAC
- **JWT** issued via `/api/auth/login` and verified on protected routes.
- **Role-based access control** restricts endpoints to `patient`, `doctor`, or `admin` roles.
- Role assignment middleware centralizes authorization checks.

### Sample Prediction Request
```bash
curl -X POST http://localhost:8080/api/predict/heart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"age":55,"bmi":28,"bloodPressureSystolic":150,"bloodPressureDiastolic":95,"bloodGlucose":130}'
```

### Response
> The default heuristic engine returns a **deterministic risk score** (`riskScore`), **not** a calibrated probability. `model.calibrated` is `false`.
```json
{
  "diseaseType": "heart-disease",
  "riskScore": 0.82,
  "riskPercentage": 82,
  "riskLevel": "High",
  "confidence": 90,
  "factors": [{ "name": "Blood Pressure", "impact": "negative", "contribution": 88 }],
  "recommendations": ["..."],
  "model": { "name": "...", "family": "...", "methodology": "...", "calibrated": false },
  "warnings": [],
  "disclaimer": "This system is a decision-support tool..."
}
```

Once a trained, **calibrated** ML model is integrated, the API may return a true calibrated probability:
```json
{
  "diseaseType": "heart-disease",
  "riskProbability": 0.82,
  "riskPercentage": 82,
  "riskLevel": "High",
  "model": { "name": "XGBoost", "version": "1.0", "calibrated": true }
}
```

## Datasets

| Disease | Dataset | Source | Samples | Features | Target |
|---------|---------|--------|---------|----------|--------|
| Heart Disease | Cleveland Heart Disease | UCI ML Repository | 303 | 13 + target | `target` |
| Diabetes | Pima Indians Diabetes | NIDDK | 768 | 8 + target | `Outcome` |
| Parkinson's | Oxford Parkinson's | UCI ML Repository | 195 | 22 + target | `status` |
| Hypertension | Cardiovascular Disease / Framingham Heart Study | Kaggle (Framingham) | 4,240 | 15 + target | `TenYearCHD` |

> **Hypertension note**: The `hypertension.csv` in this repo is derived from the **Framingham Heart Study cardiovascular disease dataset** (Kaggle, "Cardiovascular Disease" / "framingham.csv"). The target column is `TenYearCHD` (10-year coronary heart disease risk); systolic/diastolic blood pressure are primary features. See `datasets/README.md` for the exact name, URL, sample count, feature count, target, and license.

See `datasets/README.md` for details and preprocessing notes.

## Ethics & Limitations

### Responsible AI
- **Not a replacement for doctors** — predictions are decision-support only.
- **Uncertainty communication** — every result includes a confidence score.
- **Dataset bias** — performance may vary across demographic groups; models were not clinically validated.
- **Patient privacy** — data is handled with confidentiality in mind.

### Known Limitations
- The default heuristic engine returns **deterministic risk scores**, **not** statistically calibrated probabilities. It is rule-based and reproducible, but not learned from data.
- Models are trained on public research datasets and require clinical validation.
- Cannot account for all individual health factors, genetics, or lifestyle.
- Requires retraining to stay current with evolving medical knowledge.
- No system here has been clinically validated; it is for research and educational decision-support only.

## Model Leaderboard (illustrative placeholders)

> ⚠️ **Important**: The numbers below are **illustrative placeholders** shown to demonstrate the reporting format. They are **not** produced by real training runs. Once you run `python run_all.py` with the actual datasets, these will be replaced by real metrics from `ml/outputs/*_metrics_report.csv`.

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|-------|----------|-----------|--------|-----|---------|
| Logistic Regression | 82.1% | 80.4% | 78.9% | 79.6% | 0.86 |
| Random Forest | 84.7% | 83.2% | 81.5% | 82.3% | 0.89 |
| XGBoost | 87.3% | 86.1% | 84.8% | 85.4% | 0.92 |
| Neural Network | 85.8% | 84.3% | 82.7% | 83.5% | 0.90 |

## Ablation Study (illustrative)

The pipeline includes an ablation study (`ml/ablation.py`) that isolates the effect of each preprocessing step on performance. The table below is a **template**; real values are written by running the ablation.

| Experiment | Features | SMOTE | Scaling | Model | ROC-AUC |
|------------|----------|-------|---------|-------|---------|
| Baseline | Original | ❌ | ❌ | Logistic Regression | — |
| Exp 2 | Original | ✅ | ❌ | Logistic Regression | — |
| Exp 3 | Processed | ✅ | ✅ | Random Forest | — |
| Exp 4 | Processed | ✅ | ✅ | XGBoost | — |

## Proposed Roadmap

Larger features are planned but **not yet implemented**. They are documented here for scoping.

### 1. Patient Prediction History (PostgreSQL)
Replace the in-memory store with a persistent **PostgreSQL** prediction-history store so each patient can see their risk trend over time:

```
Patient
   ↓
Prediction History
   ├── 12 Aug — Heart Risk — 72%
   ├── 20 Aug — Diabetes Risk — 31%
   └── 02 Sep — Heart Risk — 45%
```

This enables a **risk trend over time** chart and a more complete full-stack feature. PostgreSQL is already in `docker-compose.yml`.

### 2. AI Explanation Layer (LLM explains, does not decide)
An optional LLM (e.g., Gemini) can generate **human-readable explanations of the already-computed ML result**, but must **not** generate or alter the medical prediction:

```
ML Model
   ↓
Risk = 73%
   ↓
SHAP factors
   ↓
LLM
   ↓
Human-readable explanation
```

The ML model decides; the LLM only explains — keeping the medical decision safe and traceable.

### 3. Disease/Model-Specific SHAP Visualization
SHAP is already computed per-disease (`ml/explainability/shap_analysis.py`). A future UI enhancement will render per-disease, per-model factor contributions with a "Why is my risk elevated?" panel:

```
Heart Disease → XGBoost → SHAP
   Age            +0.21
   Blood Pressure +0.17
   Cholesterol    +0.12
   BMI            +0.08
```

## Getting Started

### 1. Frontend (React/Vite)
```bash
cd mental-health-bot-main
npm install
npm run dev        # http://localhost:5173
```

### 2. Backend API (Express/TS)
```bash
cd backend
npm install
npm run dev        # http://localhost:8080  (Swagger: /api-docs)
```

### 3. ML Pipeline (Python research)
```bash
cd ml
pip install -r requirements.txt
python run_all.py  # trains models, writes metrics + plots to ml/outputs/
```

### 4. Docker (full stack)
```bash
docker-compose up --build
# frontend : http://localhost:5173
# api      : http://localhost:8080  (Swagger: /api-docs)
```

## CI
`.github/workflows/ci.yml` runs on push/PR to `main`/`develop`:
- Frontend: lint, build, vitest
- Backend: typecheck, API tests, build
- ML: Python module compilation checks

## License

This project is for **educational and research purposes only**.
