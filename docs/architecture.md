# EarnSure Architecture (High Level)

EarnSure is a monorepo with separately deployable services:

- **Backend API (Express)**: policy lifecycle, trigger orchestration, payouts, auth, integrations.
- **AI Engine (FastAPI)**: model-backed scoring (risk, fraud, document triage), feature extraction, explainability.
- **Postgres**: source of truth for policies, triggers, and payouts.
- **Dashboard (React)**: internal ops/admin UI for monitoring and managing policies and payouts.

## Typical flow (parametric insurance)

1. Create policy and attach trigger configuration (index/threshold/source).
2. Ingest external signals (weather/IoT/flight status/etc.) into backend.
3. Backend evaluates trigger; if met, records payout and initiates disbursement.
4. AI engine assists (optional) with anomaly checks, risk scoring, and human review routing.

