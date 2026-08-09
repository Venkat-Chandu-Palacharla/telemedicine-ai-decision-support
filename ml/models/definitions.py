"""Model definitions for the training pipeline.

Includes: Logistic Regression, Random Forest, XGBoost, and a Neural Network (MLP).

The neural network uses Keras if TensorFlow is available; otherwise it falls back
to scikit-learn's MLPClassifier so the pipeline remains runnable without TF.
"""

from __future__ import annotations

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    xgb = None
    HAS_XGB = False

try:
    from tensorflow import keras
    HAS_TF = True
except ImportError:
    keras = None
    HAS_TF = False

from config import NN_EPOCHS, NN_BATCH_SIZE, SEED

MODEL_NAMES = ["Logistic Regression", "Random Forest", "XGBoost", "Neural Network"]


def get_sklearn_models():
    """Return the base sklearn/XGBoost models (excluding NN)."""
    models = {
        "Logistic Regression": LogisticRegression(max_iter=2000, random_state=SEED),
        "Random Forest": RandomForestClassifier(n_estimators=200, random_state=SEED, n_jobs=-1),
    }
    if HAS_XGB:
        models["XGBoost"] = xgb.XGBClassifier(
            n_estimators=200, max_depth=4, learning_rate=0.05,
            use_label_encoder=False, eval_metric="logloss", random_state=SEED,
        )
    return models


def build_nn(input_dim: int, has_tf: bool = HAS_TF):
    """Build a neural network classifier.

    Returns a Keras Sequential model if TF is available, else an sklearn MLP.
    """
    if has_tf and keras is not None:
        model = keras.Sequential(
            [
                keras.layers.Input(shape=(input_dim,)),
                keras.layers.Dense(32, activation="relu"),
                keras.layers.Dropout(0.2),
                keras.layers.Dense(16, activation="relu"),
                keras.layers.Dense(1, activation="sigmoid"),
            ]
        )
        model.compile(
            optimizer="adam",
            loss="binary_crossentropy",
            metrics=["accuracy"],
        )
        return model, "keras"
    return (
        MLPClassifier(
            hidden_layer_sizes=(32, 16),
            activation="relu",
            max_iter=NN_EPOCHS,
            random_state=SEED,
        ),
        "mlp",
    )


def nn_fit(model, kind, X_train, y_train, X_val, y_val):
    """Fit the neural network, returning a history-like object or None."""
    if kind == "keras":
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=NN_EPOCHS,
            batch_size=NN_BATCH_SIZE,
            verbose=0,
        )
        return history
    model.fit(X_train, y_train)
    return None


def nn_predict_proba(model, kind, X):
    """Return predicted probabilities for the positive class."""
    if kind == "keras":
        return model.predict(X, verbose=0).ravel()
    return model.predict_proba(X)[:, 1]
