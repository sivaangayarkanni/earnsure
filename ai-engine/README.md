# EarnSure AI Engine

FastAPI service intended for ML/LLM inference and underwriting/risk scoring helpers.

- Health check: `GET /health`

## Run (local)

1. `python -m venv .venv`
2. Activate venv
3. `pip install -r requirements.txt`
4. `cp .env.example .env`
5. `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

