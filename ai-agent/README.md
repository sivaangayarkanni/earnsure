# EarnSure AI Agent

CLI agent that uses an OpenAI-compatible API and calls MCP tools.

## Environment

Copy `.env.example` to `.env`.

## Run

```
node src/agent.js "Quote a $25k weather policy for 90 days"
```

## Orchestrator

Runs a multi-step workflow across MCP tools.

```
node src/orchestrator.js "{\"city\":\"Bengaluru\",\"worker_id\":\"<worker-id>\",\"policy_id\":\"<policy-id>\",\"pool_id\":\"<pool-id>\",\"claim_amount\":450}"
```

## Simulation

Runs an end-to-end MCP scenario (register worker, create policy, weather check, claim, fraud check, pool payout, payment).

```
npm run simulate
```
