# EarnSure MCP Server

Model Context Protocol server exposing parametric insurance tools.

## Tools

- `weather_tool`: Fetch OpenWeather data (rainfall, temperature, condition).
- `risk_prediction_tool`: Call the ML service for risk scoring.
- `claim_tool`: Create/update claims with standardized lost-income formula.
- `fraud_detection_tool`: Rule-based fraud checks.
- `risk_pool_tool`: Pool membership, contributions, and payouts.
- `payment_tool`: Simulated UPI payout.
- `zone_recommendation_tool`: Suggests high-demand zones.

## Environment

Copy `.env.example` to `.env` and update values.

## Run (stdio)

```
node server.js
```
