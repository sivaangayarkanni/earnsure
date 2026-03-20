import os

try:
    import joblib
except Exception:  # pragma: no cover - optional dependency
    joblib = None

MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(os.path.dirname(__file__), "models", "risk_model.joblib"))
MODEL_VERSION = os.getenv("MODEL_VERSION", "rf-v1")

_MODEL = None


def load_model():
    global _MODEL
    if _MODEL is not None:
        return _MODEL
    if joblib is None:
        return None
    if not os.path.exists(MODEL_PATH):
        return None
    try:
        _MODEL = joblib.load(MODEL_PATH)
    except Exception:
        _MODEL = None
    return _MODEL
