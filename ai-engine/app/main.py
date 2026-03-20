from fastapi import FastAPI

from .config import settings
from .logging import configure_logging
from .risk import RiskInput, RiskOutput, predict_risk
from .train import train_and_save
from .fraud import FraudInput, FraudOutput, predict_fraud

configure_logging()

app = FastAPI(title="EarnSure AI Engine", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "earnsure-ai-engine", "env": settings.env}


@app.post("/risk/predict", response_model=RiskOutput)
def risk_predict(data: RiskInput):
    return predict_risk(data)


@app.post("/fraud/score", response_model=FraudOutput)
def fraud_score(data: FraudInput):
    return predict_fraud(data)


if settings.enable_training_endpoint:

    @app.post("/risk/train")
    def risk_train():
        path = train_and_save()
        return {"status": "ok", "model_path": path}
