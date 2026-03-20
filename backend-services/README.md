# EarnSure Backend Services

Production API for EarnSure with JWT auth, OTP login, MCP tool bridge, and admin/worker endpoints.

## Key Endpoints

- `POST /auth/request-otp`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `POST /auth/logout`

Worker (auth required):
- `GET /worker/profile`
- `GET /worker/policy`
- `GET /worker/claims`
- `GET /worker/alerts`
- `GET /worker/zones`
- `GET /worker/stability`
- `GET /worker/premium-breakdown`
- `GET /worker/notifications`

Admin (auth required):
- `GET /admin/overview`
- `GET /admin/workers`
- `GET /admin/disruptions`
- `GET /admin/alerts`
- `GET /admin/heatmap`
- `GET /admin/downtime`
- `GET /admin/claims`
- `GET /admin/fraud`
- `GET /admin/pools`
- `GET /admin/reports/payouts?month=YYYY-MM&format=csv|json`
- `GET /admin/reports/audit?month=YYYY-MM`

MCP bridge (auth required):
- `POST /mcp/weather`
- `POST /mcp/risk`
- `POST /mcp/claim`
- `POST /mcp/fraud`
- `POST /mcp/pool`
- `POST /mcp/payment`
- `POST /mcp/zones`
- `POST /mcp/downtime`
- `POST /mcp/stability`
- `POST /mcp/orchestrate`

Ingest (optional API key):
- `POST /ingest/demand`
- `POST /ingest/activity`
- `POST /ingest/traffic`

Mock feed (optional, ENABLE_MOCK_FEED=true):
- `GET /mock/platform-feed`

Policy operations:
- `POST /policies/:id/pause`
- `POST /policies/:id/resume`

Monitoring:
- `GET /metrics` (Prometheus scrape endpoint)

## Environment

Copy `.env.example` to `.env` and configure secrets, Twilio, and OpenWeather.
