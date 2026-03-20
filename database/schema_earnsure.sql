-- EarnSure schema (PostgreSQL)
-- Uses UUID primary keys + JSONB for flexible coverage details.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Workers
CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  city TEXT NOT NULL,
  platform TEXT NOT NULL,
  risk_score NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (risk_score >= 0 AND risk_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Policies
CREATE TABLE IF NOT EXISTS policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  weekly_premium NUMERIC(12,2) NOT NULL CHECK (weekly_premium >= 0),
  coverage_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'expired', 'cancelled')),
  start_date DATE NOT NULL
);

-- Claims
CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  lost_income NUMERIC(12,2) NOT NULL CHECK (lost_income >= 0),
  claim_status TEXT NOT NULL CHECK (claim_status IN ('submitted', 'approved', 'rejected', 'paid')),
  payout_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (payout_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Risk Events (external or internal signals)
CREATE TABLE IF NOT EXISTS risk_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity NUMERIC(6,3) NOT NULL CHECK (severity >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Worker-level transactions (premium payments / claim payouts)
CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES claims(claim_id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  payment_method TEXT NOT NULL
);

-- Pools (mutual risk pools per city)
CREATE TABLE IF NOT EXISTS pools (
  pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  total_balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_balance >= 0),
  reserve_fund NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (reserve_fund >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pool Members
CREATE TABLE IF NOT EXISTS pool_members (
  pool_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(pool_id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  weekly_contribution NUMERIC(12,2) NOT NULL CHECK (weekly_contribution >= 0),
  UNIQUE (pool_id, worker_id)
);

-- Pool Transactions (contributions / payouts / reserve moves)
CREATE TABLE IF NOT EXISTS pool_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(pool_id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('contribution', 'payout', 'reserve_move', 'adjustment')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Zone Demand (optional operational telemetry)
CREATE TABLE IF NOT EXISTS zone_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  zone TEXT NOT NULL,
  demand_level NUMERIC(6,3) NOT NULL CHECK (demand_level >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workers_city ON workers(city);
CREATE INDEX IF NOT EXISTS idx_workers_platform ON workers(platform);

CREATE INDEX IF NOT EXISTS idx_policies_worker_id ON policies(worker_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);

CREATE INDEX IF NOT EXISTS idx_risk_events_location_type ON risk_events(location, event_type);
CREATE INDEX IF NOT EXISTS idx_risk_events_time ON risk_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_transactions_worker_id ON transactions(worker_id);
CREATE INDEX IF NOT EXISTS idx_transactions_claim_id ON transactions(claim_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_pools_city ON pools(city);

CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_worker ON pool_members(worker_id);

CREATE INDEX IF NOT EXISTS idx_pool_transactions_pool ON pool_transactions(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_transactions_worker ON pool_transactions(worker_id);
CREATE INDEX IF NOT EXISTS idx_pool_transactions_time ON pool_transactions(timestamp);

CREATE INDEX IF NOT EXISTS idx_zone_demand_city_zone ON zone_demand(city, zone);
CREATE INDEX IF NOT EXISTS idx_zone_demand_time ON zone_demand(recorded_at);
