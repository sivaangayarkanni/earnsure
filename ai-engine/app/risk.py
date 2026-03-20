from pydantic import BaseModel, Field

from .model_store import load_model, MODEL_VERSION


class RiskInput(BaseModel):
    city: str
    rain_probability: float = Field(ge=0, le=1)
    AQI: float = Field(ge=0)
    temperature: float


class RiskOutput(BaseModel):
    city: str
    risk_score: float
    risk_level: str
    recommended_weekly_premium: float
    model_version: str | None = None


def predict_risk(data: RiskInput) -> RiskOutput:
    model = load_model()
    risk_score = None
    if model is not None:
        try:
            risk_score = float(
                model.predict([[data.rain_probability, data.AQI, data.temperature]])[0]
            )
            risk_score = max(0.0, min(risk_score, 1.0))
        except Exception:
            risk_score = None

    if risk_score is None:
        aqi_score = min(data.AQI / 500, 1.0)

        temp = data.temperature
        if temp > 40:
            temp_score = min((temp - 40) / 20, 1.0)
        elif temp < 10:
            temp_score = min((10 - temp) / 20, 1.0)
        else:
            temp_score = 0.0

        risk_score = round(
            (data.rain_probability * 0.5) + (aqi_score * 0.3) + (temp_score * 0.2),
            4,
        )
        risk_score = min(risk_score, 1.0)

    if risk_score < 0.35:
        risk_level = "low"
        premium = 25.0
    elif risk_score < 0.65:
        risk_level = "medium"
        premium = 35.0
    else:
        risk_level = "high"
        premium = 50.0

    return RiskOutput(
        city=data.city,
        risk_score=risk_score,
        risk_level=risk_level,
        recommended_weekly_premium=premium,
        model_version=MODEL_VERSION if model is not None else "heuristic-v1",
    )
