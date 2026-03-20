from pydantic import BaseModel, Field

from .fraud_model_store import load_fraud_model, FRAUD_MODEL_VERSION


class FraudInput(BaseModel):
    duplicate_claims: float = Field(ge=0, le=1)
    gps_mismatch: float = Field(ge=0, le=1)
    abnormal_frequency: float = Field(ge=0, le=1)
    low_acceptance: float = Field(ge=0, le=1)
    gps_spoofing: float = Field(ge=0, le=1)
    idle_online: float = Field(ge=0, le=1)


class FraudOutput(BaseModel):
    fraud_score: float
    model_version: str | None = None


def predict_fraud(data: FraudInput) -> FraudOutput:
    model = load_fraud_model()
    if model:
        try:
            score = float(
                model.predict_proba(
                    [
                        [
                            data.duplicate_claims,
                            data.gps_mismatch,
                            data.abnormal_frequency,
                            data.low_acceptance,
                            data.gps_spoofing,
                            data.idle_online,
                        ]
                    ]
                )[0][1]
            )
            score = max(0.0, min(score, 1.0))
            return FraudOutput(fraud_score=score, model_version=FRAUD_MODEL_VERSION)
        except Exception:
            pass

    # Fallback rule-based score
    score = (
        data.duplicate_claims * 0.25
        + data.gps_mismatch * 0.2
        + data.abnormal_frequency * 0.2
        + data.low_acceptance * 0.15
        + data.gps_spoofing * 0.15
        + data.idle_online * 0.05
    )
    score = max(0.0, min(score, 1.0))
    return FraudOutput(fraud_score=score, model_version="fraud-heuristic")
