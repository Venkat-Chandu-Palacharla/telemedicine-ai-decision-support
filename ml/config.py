"""Central configuration for the ML pipeline."""

from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATASETS_DIR = BASE_DIR.parent / "datasets"
OUTPUTS_DIR = BASE_DIR / "outputs"
MODELS_DIR = OUTPUTS_DIR / "models"

# Create output dirs
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Split ratios (train / validation / test)
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# Cross-validation folds
CV_FOLDS = 5

# Random seed for reproducibility
SEED = 42

# Dataset configurations
# Each entry points to a CSV path under ../datasets and gives the target column.
DATASETS = {
    "heart-disease": {
        "path": DATASETS_DIR / "heart" / "heart.csv",
        "target": "target",
        "name": "Cleveland Heart Disease",
        "source": "UCI Machine Learning Repository",
    },
    "diabetes": {
        "path": DATASETS_DIR / "diabetes" / "diabetes.csv",
        "target": "Outcome",
        "name": "Pima Indians Diabetes",
        "source": "National Institute of Diabetes (NIDDK)",
    },
    "parkinsons": {
        "path": DATASETS_DIR / "parkinsons" / "parkinsons.csv",
        "target": "status",
        "name": "Oxford Parkinson's Disease",
        "source": "UCI ML Repository (Oxford)",
    },
"hypertension": {
        "path": DATASETS_DIR / "hypertension" / "hypertension.csv",
        "target": "target",
        "name": "Hypertension Risk (Framingham-derived)",
        "source": "Cardiovascular Disease / Framingham Heart Study (Kaggle)",
    },
}

# Model hyperparameters for the NN (kept small for reproducibility)
NN_EPOCHS = 50
NN_BATCH_SIZE = 32

print(f"ML outputs will be written to: {OUTPUTS_DIR}")
