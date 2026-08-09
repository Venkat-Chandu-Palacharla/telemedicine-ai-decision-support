# TeleMedicine AI - Improvement Implementation Plan (Round 2)

## Phase A: Terminology correction (deterministic risk score, not probability) ✅
- [x] Update `mental-health-bot-main/README.md` sample response + terminology
- [x] Rename `probability` → `riskScore` in `mental-health-bot-main/src/types/telemedicine.ts`
- [x] Ensure no frontend/backend usage of `probability` remains

## Phase B: ML calibration integration + ablation + leaderboard + pipeline docs ✅
- [x] Wire `calibrate_and_report(...)` into `ml/train.py` (try/except, best model only)
- [x] Add `ml/ablation.py` (Baseline → SMOTE → Scaling+SMOTE experiments) writing CSV
- [x] Run ablation in `ml/run_all.py`
- [x] Add Model Leaderboard + Ablation Study tables + calibration pipeline diagram to `ml/README.md` and `mental-health-bot-main/README.md` (illustrative placeholders only)

## Phase C: Dataset correction (hypertension: specific dataset) ✅
- [x] Update `ml/config.py` hypertension entry with exact dataset name/source
- [x] Update `datasets/README.md` hypertension row with exact name, URL, samples, features, target, license
- [x] Add hypertension entry to `mental-health-bot-main/src/components/ml/DatasetJustification.tsx`

## Phase D: No-data-leakage workflow documentation ✅
- [x] Document `Train → Pipeline → Scaling → SMOTE → Model` + held-out test rule in `ml/README.md` and `mental-health-bot-main/README.md`

## Phase E: Security - JWT secret production fail-fast ✅
- [x] Update `backend/src/config/env.ts` to warn/fail-fast on default secret in production

## Phase F: Roadmap documentation (patient history, LLM explanation, disease-specific SHAP) ✅
- [x] Add "Proposed Roadmap" section to `mental-health-bot-main/README.md`

## Validation
- [x] Backend typecheck (`tsc --noEmit`) — EXIT 0
- [x] `npx vitest run` — 11/11 tests passed
- [x] Python `py_compile` for modified `ml/*.py` — EXIT 0
- [x] Frontend TypeScript typecheck (`tsc -p tsconfig.app.json --noEmit`) — EXIT 0 (fixed 4 errors: added `admin_update_user_role` RPC typing, added missing `Phone` import, excluded test files from app tsconfig)
- [x] Frontend production build (`vite build`) — EXIT 0
- [x] Re-verified backend typecheck + vitest (11/11) + Python compile after all Round 2 changes
