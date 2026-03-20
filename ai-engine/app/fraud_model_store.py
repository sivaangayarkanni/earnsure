import os

try:
    import joblib
except Exception:  # pragma: no cover
    joblib = None

FRAUD_MODEL_PATH = os.getenv(
    "FRAUD_MODEL_PATH", os.path.join(os.path.dirname(__file__), "models", "fraud_model.joblib")
)
FRAUD_MODEL_VERSION = os.getenv("FRAUD_MODEL_VERSION", "fraud-rf-v1")

_MODEL = None


def load_fraud_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    if joblib is None:
        return None
    if not os.path.exists(FRAUD_MODEL_PATH):
        return None
    try:
        _MODEL = joblib.load(FRAUD_MODEL_PATH)
    except Exception:
        _MODEL = None
    return _MODEL
