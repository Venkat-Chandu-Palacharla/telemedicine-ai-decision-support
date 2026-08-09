# Datasets

This directory contains the raw datasets used by the ML training pipeline (`../ml`).

> ⚠️ Some datasets are large public files that are not committed to the repository.
> Download them from their public sources and place them in the subdirectories shown below.

## Required Files

| Subdirectory | Filename | Disease | Source |
|--------------|----------|---------|--------|
| `heart/` | `heart.csv` | Heart Disease | UCI Heart Disease (Cleveland) — [UCI ML Repository](https://archive.ics.uci.edu/ml/datasets/heart+disease) |
| `diabetes/` | `diabetes.csv` | Diabetes | Pima Indians Diabetes (NIDDK) — [Kaggle](https://www.kaggle.com/datasets/uciml/pima-indians-diabetes-database) |
| `parkinsons/` | `parkinsons.csv` | Parkinson's | Oxford Parkinson's Voice — [UCI ML Repository](https://archive.ics.uci.edu/ml/datasets/parkinsons) |
| `hypertension/` | `hypertension.csv` | Hypertension | Cardiovascular Disease / Framingham Heart Study — [Kaggle](https://www.kaggle.com/datasets/aasheesh200/framingham-heart-study-dataset) |

## Target Columns

Each CSV must include a binary target (0/1) column:

- `heart/`: target column `target`
- `diabetes/`: target column `Outcome`
- `parkinsons/`: target column `status`
- `hypertension/`: target column `target`

## Hypertension Dataset (exact source)

The `hypertension.csv` file is derived from the **Framingham Heart Study cardiovascular disease (CHD) dataset**, a widely used public dataset for 10-year coronary heart disease risk prediction.

| Field | Value |
|-------|-------|
| **Dataset name** | Framingham Heart Study Cardiovascular Disease (CHD) dataset |
| **Source** | Kaggle — [framingham-heart-study-dataset](https://www.kaggle.com/datasets/aasheesh200/framingham-heart-study-dataset) |
| **Samples** | 4,240 (after dropping missing `education`) |
| **Features** | 15 (age, sex, cigsPerDay, totChol, sysBP, diaBP, BMI, heartRate, glucose, etc.) |
| **Target** | `TenYearCHD` (binary 10-year CHD risk) — mapped to `target` in this repo |
| **License** | Public dataset for research/educational use (Kaggle terms) |

> ⚠️ **Note**: The original dataset's target is `TenYearCHD`; in `ml/config.py` the target column used is `target` to match the local `hypertension.csv` convention. Ensure the CSV you place under `datasets/hypertension/` has a binary target column named `target` (or adjust `ml/config.py` accordingly).

## Preprocessing

The pipeline handles missing values (median imputation), feature scaling
(StandardScaler), and class imbalance (SMOTE). See `ml/README.md` and
`ml/preprocessing/preprocess.py`.

## Ethical Note

These datasets are used strictly for **research and educational purposes**.
The system is a **decision-support tool**, not a substitute for professional
medical diagnosis. Some datasets may have demographic limitations or bias
(e.g., the Pima dataset is limited to females of Pima Indian heritage). See
`ml/README.md` for known limitations.
