-- Parametric insurance schema for gig workers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  platform TEXT NOT NULL,
  risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policies (
  policy_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  weekly_premium NUMERIC(12, 2) NOT NULL CHECK (weekly_premium >= 0),
  coverage_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  lost_income NUMERIC(12, 2) NOT NULL CHECK (lost_income >= 0),
  claim_status TEXT NOT NULL DEFAULT 'submitted',
  payout_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (payout_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity INT NOT NULL CHECK (severity >= 0),
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES claims(claim_id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);
CREATE INDEX IF NOT EXISTS idx_workers_city_platform ON workers(city, platform);

CREATE INDEX IF NOT EXISTS idx_policies_worker_id ON policies(worker_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);

CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(claim_status);

CREATE INDEX IF NOT EXISTS idx_risk_events_location ON risk_events(location);
CREATE INDEX IF NOT EXISTS idx_risk_events_type_time ON risk_events(event_type, timestamp);

CREATE INDEX IF NOT EXISTS idx_transactions_worker_id ON transactions(worker_id);
CREATE INDEX IF NOT EXISTS idx_transactions_claim_id ON transactions(claim_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

