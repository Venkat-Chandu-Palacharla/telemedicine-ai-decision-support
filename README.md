# TeleMedicine AI — Decision-Support Health Prediction System

> ⚠️ **Important Disclaimer**: This system is a **decision-support tool**, not a substitute for professional medical diagnosis. The Express demo API returns heuristic scores; the frontend's separate Supabase Edge Function returns AI-generated estimates. Neither is clinically validated, and neither should be interpreted as a statistically calibrated probability.

An end-to-end AI healthcare decision-support platform built as a research and educational project, demonstrating machine learning, explainable AI, model evaluation, probability calibration, and full-stack deployment.

## Overview

The platform comprises three integrated components:

- **React + Vite web dashboard** — patient / doctor / admin portals with ML documentation, illustrative model-comparison/evaluation views, and PDF reports.
- **Express (TypeScript) REST API** — transparent heuristic inference engine with JWT authentication, role-based access control (RBAC), Zod validation, rate limiting, and Swagger/OpenAPI docs.
- **Python ML research pipeline** — Logistic Regression, Random Forest, XGBoost, and Neural Network with evaluation, calibration reports, ablation study, and SHAP explainability.

Supported diseases: **Heart Disease**, **Diabetes**, **Parkinson's Disease**, and **Hypertension**.

---

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
 Risk Score + Confidence + RBAC + Swagger      LR / RF / XGBoost / NN
        │                                                 │
        │                              + Calibration + Ablation + SHAP
        └────────────────────────┬────────────────────────┘
                                 │
                      Web Dashboard (React/Vite)
```

- The **Express API** runs out-of-the-box with a deterministic heuristic inference engine — no training data or external API keys required.
- The **Python pipeline** (`ml/`) can produce trained models and evaluation artifacts when datasets are provided. Its offline calibration reports and model files are **not currently integrated into backend predictions**; the backend continues to use the heuristic engine.
- The **frontend prediction screen** calls the authenticated Supabase `ai-prediction` Edge Function. The Express API is a separate demonstration API and is not called by the frontend.

---

## Repository Layout

```
├── backend/                 # Express + TypeScript REST API (decision-support)
│   ├── src/
│   │   ├── engine/          # Heuristic inference engine
│   │   ├── middleware/      # JWT auth, RBAC, error handling, rate limit, validation
│   │   ├── models/          # Disease config & risk thresholds
│   │   ├── routes/          # health, auth, predict endpoints
│   │   ├── schemas/         # Zod request validation
│   │   ├── swagger/         # OpenAPI spec → /api-docs (self-documented)
│   │   └── app.ts / server.ts
│   └── tests/               # Vitest + Supertest API tests
├── ml/                      # Python ML research pipeline
│   ├── preprocessing/       # Cleaning, imputation, scaling, encoding, SMOTE
│   ├── models/              # Model definitions & serialization
│   ├── explainability/      # SHAP analysis
│   ├── train.py / evaluate.py / run_all.py
│   ├── calibration.py       # Platt scaling + Isotonic, Brier + ECE
│   ├── ablation.py          # Preprocessing-step ablation study
│   └── config.py
├── mental-health-bot-main/  # React + Vite frontend
├── datasets/                # Dataset documentation (exact sources)
├── docker-compose.yml       # frontend + api + postgres + mongo
└── .github/workflows/ci.yml # CI (frontend, backend, ML)
```

---

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
- Model metrics on the held-out test split

### Validation Methodology
A proper **70 / 15 / 15 train-validation-test** split is used:
1. **Train** — fit the model
2. **Validation** — selects the model by ROC-AUC and is also used for offline calibration evaluation; the current pipeline does not implement cross-validation or GridSearchCV/RandomizedSearchCV
3. **Test** — held-out reporting for candidate models; it is not used for model selection or tuning

### Offline Calibration Evaluation (ML research pipeline)
The ML pipeline can fit Platt scaling and isotonic regression on validation data and report calibration metrics for trained models. These evaluation artifacts are not selected or integrated into backend predictions; the heuristic engine remains unchanged.

```
Prediction
     ↓
XGBoost / RF / LR / NN
     ↓
Calibration evaluation (Platt Scaling / Isotonic Regression)
     ↓
Brier / ECE / reliability reports
     ↓
Not integrated into backend risk output
```

The current training workflow uses validation ROC-AUC for model selection and also fits calibrators on that validation split. It reports **Brier Score**, **Expected Calibration Error (ECE)**, and reliability curves on the test split. Because validation serves both selection and calibration and no calibrator is deployed, treat these as research reports, not evidence that the API produces calibrated probabilities. See `ml/calibration.py`.

### Ablation Study
`ml/ablation.py` isolates the effect of each preprocessing step on performance, so the project demonstrates **actual experimentation**, not just model training:

| Experiment | Features | SMOTE | Scaling | Model | ROC-AUC |
|------------|----------|-------|---------|-------|---------|
| Baseline | Original | ❌ | ❌ | Logistic Regression | — |
| Exp 2 | Original | ✅ | ❌ | Logistic Regression | — |
| Exp 3 | Processed | ✅ | ✅ | Random Forest | — |
| Exp 4 | Processed | ✅ | ✅ | XGBoost | — |

> ⚠️ The table above is a **template**; real values are written to `ml/outputs/models/*_ablation.csv` when you run the pipeline.

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
- **Calibration** is fit on validation only; the test set is reserved for final, unbiased evaluation.

### Explainability (XAI)
- **SHAP** (SHapley Additive exPlanations) is computed on the best-performing model per disease.
- Feature-importance bar/summary plots; local and global interpretation of each prediction.

### Risk Output (not a binary Yes/No)
Instead of a binary diagnosis, the system produces a **deterministic risk score**:
- 🟢 **Low Risk** (0–40%)
- 🟡 **Moderate Risk** (40–70%)
- 🔴 **High Risk** (70–100%)

> ⚠️ **Terminology**: The default heuristic engine produces a **deterministic risk score**, **not** a statistically calibrated probability. A score of `0.82` does **not** mean "82 out of 100 similar patients will develop this disease." It is a rule-based, reproducible estimate for decision-support. Once a trained, calibrated ML model is integrated, the output can legitimately be labeled a calibrated probability.

The Express heuristic API also includes a **completeness indicator** and rule-based factor contributions. The frontend's separate Supabase AI Edge Function currently returns an AI-generated confidence estimate; it is not a validated statistical measure. Its generated factor notes are not SHAP values. Prediction percentages are risk scores, not calibrated probabilities.

---

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
- Local-development demo users: `patient@demo.com`, `doctor@demo.com`, `admin@demo.com` (password `demo1234`). The demo login endpoint is disabled when `NODE_ENV=production`; configure a real authentication provider before exposing the Express API in production.

### Sample Prediction Request
```bash
curl -X POST http://localhost:8080/api/predict/heart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"age":55,"bmi":28,"bloodPressureSystolic":150,"bloodPressureDiastolic":95,"bloodGlucose":130}'
```

### Response (heuristic engine)
> The default heuristic engine returns a **deterministic risk score** (`riskScore`), **not** a calibrated probability. `model.calibrated` is `false`.
```json
{
  "diseaseType": "heart-disease",
  "riskScore": 0.82,
  "riskPercentage": 82,
  "riskLevel": "High",
  "confidence": 88,
  "factors": [{ "name": "Blood Pressure", "impact": "negative", "contribution": 88 }],
  "recommendations": ["..."],
  "model": { "name": "...", "family": "...", "methodology": "...", "calibrated": false },
  "warnings": [],
  "disclaimer": "This system is a decision-support tool..."
}
```

### Response (future trained + calibrated model)
This is a future response shape only. The current backend does not load a trained model or fitted calibrator:
```json
{
  "diseaseType": "heart-disease",
  "riskProbability": 0.82,
  "riskPercentage": 82,
  "riskLevel": "High",
  "model": { "name": "XGBoost", "version": "1.0", "calibrated": true }
}
```

### Security
- **Helmet** security headers, **CORS** allow-list, **rate limiting** (login + prediction).
- **Zod** input validation; **bcrypt** password hashing.
- **Sanitized request logging** — JWT `Authorization` header is redacted; no body content is logged.
- Production requires an explicitly supplied, strong, unique JWT secret and rejects known placeholders; demo login is disabled in production.

---

## Datasets

| Disease | Dataset | Source | Samples | Features | Target |
|---------|---------|--------|---------|----------|--------|
| Heart Disease | Cleveland Heart Disease | UCI ML Repository | 303 | 13 + target | `target` |
| Diabetes | Pima Indians Diabetes | NIDDK | 768 | 8 + target | `Outcome` |
| Parkinson's | Oxford Parkinson's | UCI ML Repository | 195 | 22 + target | `status` |
| 10-year coronary heart disease risk | Framingham Heart Study CHD | Kaggle (Framingham) | 4,240 | 15 + target | `TenYearCHD` |

> The Framingham `TenYearCHD` target is coronary heart disease risk, not hypertension. The backend hypertension endpoint is a separate heuristic scoring task. Dataset source, target definition, and limitations are documented in `datasets/README.md`.

---

## Model Leaderboard (illustrative placeholders)

> ⚠️ **Important**: This table shows a reporting template only. The frontend does not load metrics from training runs, and running `python run_all.py` does not automatically update this table.

| Model               | Accuracy | Precision | Recall | F1 | ROC-AUC |
| ------------------- | -------: | --------: | -----: | -: | ------: |
| Logistic Regression |        — |         — |      — |  — |       — |
| Random Forest       |        — |         — |      — |  — |       — |
| XGBoost             |        — |         — |      — |  — |       — |
| Neural Network      |        — |         — |      — |  — |       — |

---

## Ethics & Limitations

### Responsible AI
- **Not a replacement for doctors** — predictions are decision-support only.
- **Uncertainty communication** — the frontend displays an unvalidated AI-generated confidence estimate; the Express heuristic API's completeness indicator is not statistical confidence.
- **Dataset bias** — performance may vary across demographic groups; models were not clinically validated.
- **Patient privacy** — data is handled with confidentiality in mind.

### Known Limitations
- The default heuristic engine returns **deterministic risk scores**, **not** statistically calibrated probabilities.
- Models are trained on public research datasets and require clinical validation.
- Cannot account for all individual health factors, genetics, or lifestyle.
- No system here has been clinically validated; it is for research and educational decision-support only.

---

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

### 2. AI Explanation Layer (LLM explains, does not decide)
An optional LLM (e.g., Gemini) can generate **human-readable explanations of the already-computed ML result**, but must **not** generate or alter the medical prediction:

```
ML Model → Risk = 73% → SHAP factors → LLM → Human-readable explanation
```

The ML model decides; the LLM only explains — keeping the medical decision safe and traceable.

### 3. Disease/Model-Specific SHAP Visualization
A future UI enhancement will render per-disease, per-model factor contributions with a **"Why is my risk elevated?"** panel:

```
Heart Disease → XGBoost → SHAP
   Age            +0.21
   Blood Pressure +0.17
   Cholesterol    +0.12
   BMI            +0.08
```

---

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
python run_all.py  # trains models, runs calibration + ablation, writes metrics + plots to ml/outputs/
```

### 4. Docker (full stack)
Copy `.env.example` to `.env`, then set the Supabase project URL, its publishable (public) key, and a unique JWT secret of at least 32 characters. For example, generate the JWT secret locally with `openssl rand -hex 32`. Never commit `.env` or use a placeholder secret in production.

The Supabase values are embedded into the frontend at image build time. They are public client configuration, not service-role secrets. Configure Supabase Auth and review/enable row-level security policies for every table before using real user data. The prediction Edge Function checks the user's Supabase access token; the browser frontend and Express demo API use separate authentication paths.

```bash
docker-compose up --build
# frontend : http://localhost:5173
# api      : http://localhost:8080  (Swagger: /api-docs)
```

Compose requires all three values and fails early if any are missing. In the production Compose configuration, the Express API rejects placeholder or short JWT secrets and disables its demo login. No real authentication provider is currently integrated into the Express API.

---

## CI

`.github/workflows/ci.yml` runs on push/PR to `main`/`develop`:
- **Frontend:** lint, build, vitest
- **Backend:** typecheck, API tests, build
- **ML:** Python module compilation checks

---

## License

This project is for **educational and research purposes only**.
