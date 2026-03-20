-- EarnSure production schema
-- Core tables for workers, policies, claims, risk events, and pool operations.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  city TEXT NOT NULL,
  upi_id TEXT,
  platform TEXT NOT NULL,
  risk_score NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (risk_score >= 0 AND risk_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  weekly_premium NUMERIC(12,2) NOT NULL CHECK (weekly_premium >= 0),
  coverage_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'expired', 'cancelled')),
  start_date DATE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  lost_income NUMERIC(12,2) NOT NULL CHECK (lost_income >= 0),
  claim_status TEXT NOT NULL CHECK (claim_status IN ('submitted', 'approved', 'rejected', 'paid')),
  payout_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (payout_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity NUMERIC(6,3) NOT NULL CHECK (severity >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES claims(claim_id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  payment_method TEXT NOT NULL,
  provider TEXT,
  provider_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS worker_activity (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  zone TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  online_status BOOLEAN NOT NULL DEFAULT true,
  orders_received INTEGER NOT NULL DEFAULT 0,
  orders_accepted INTEGER NOT NULL DEFAULT 0,
  earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zone_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  zone TEXT NOT NULL,
  demand_level NUMERIC(6,3) NOT NULL CHECK (demand_level >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS traffic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  zone TEXT,
  congestion_level NUMERIC(5,2) NOT NULL CHECK (congestion_level >= 0),
  speed_kph NUMERIC(6,2),
  travel_time_index NUMERIC(6,3),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  zone TEXT NOT NULL,
  orders_per_hour NUMERIC(8,2) NOT NULL CHECK (orders_per_hour >= 0),
  active_workers INTEGER NOT NULL DEFAULT 0 CHECK (active_workers >= 0),
  demand_index NUMERIC(8,2) NOT NULL CHECK (demand_index >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pools (
  pool_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  total_balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_balance >= 0),
  reserve_fund NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (reserve_fund >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pool_members (
  pool_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(pool_id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  weekly_contribution NUMERIC(12,2) NOT NULL CHECK (weekly_contribution >= 0),
  UNIQUE (pool_id, worker_id)
);

CREATE TABLE IF NOT EXISTS pool_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES pools(pool_id) ON DELETE CASCADE,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('contribution', 'payout', 'reserve_move', 'adjustment', 'reinsurance')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('risk', 'claim', 'payout', 'fraud', 'downtime', 'info')),
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'sms',
  status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'skipped')) DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS notifications
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'sms';

CREATE TABLE IF NOT EXISTS policy_payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('due', 'paid', 'failed', 'delinquent')) DEFAULT 'due',
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  provider_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (policy_id, due_date)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'admin', 'worker')),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reinsurance_fund (
  fund_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reinsurance_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID REFERENCES pools(pool_id) ON DELETE SET NULL,
  claim_id UUID REFERENCES claims(claim_id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL CHECK (type IN ('topup', 'payout')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_features (
  feature_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES claims(claim_id) ON DELETE SET NULL,
  features JSONB NOT NULL,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
CREATE INDEX IF NOT EXISTS idx_worker_activity_worker ON worker_activity(worker_id);
CREATE INDEX IF NOT EXISTS idx_zone_demand_city_zone ON zone_demand(city, zone);
CREATE INDEX IF NOT EXISTS idx_zone_demand_time ON zone_demand(recorded_at);
CREATE INDEX IF NOT EXISTS idx_traffic_events_city_zone ON traffic_events(city, zone);
CREATE INDEX IF NOT EXISTS idx_traffic_events_time ON traffic_events(recorded_at);
CREATE INDEX IF NOT EXISTS idx_platform_demand_city_zone ON platform_demand(city, zone);
CREATE INDEX IF NOT EXISTS idx_platform_demand_time ON platform_demand(recorded_at);
CREATE INDEX IF NOT EXISTS idx_pools_city ON pools(city);
CREATE INDEX IF NOT EXISTS idx_pool_members_pool ON pool_members(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_members_worker ON pool_members(worker_id);
CREATE INDEX IF NOT EXISTS idx_pool_transactions_pool ON pool_transactions(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_transactions_worker ON pool_transactions(worker_id);
CREATE INDEX IF NOT EXISTS idx_pool_transactions_time ON pool_transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_worker ON notifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_notifications_time ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_policy_payments_policy ON policy_payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_payments_worker ON policy_payments(worker_id);
CREATE INDEX IF NOT EXISTS idx_policy_payments_due ON policy_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reinsurance_transactions_pool ON reinsurance_transactions(pool_id);
CREATE INDEX IF NOT EXISTS idx_fraud_features_worker ON fraud_features(worker_id);

-- Auth & OTP
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('worker', 'admin')),
  phone TEXT UNIQUE NOT NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('worker', 'admin')),
  code_hash TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_auth_otps_phone_role ON auth_otps(phone, role);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON auth_refresh_tokens(user_id);

-- Algorithm Downtime Detection table
CREATE TABLE IF NOT EXISTS algorithm_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  zone TEXT,
  online_status BOOLEAN NOT NULL DEFAULT true,
  orders_received INTEGER NOT NULL DEFAULT 0,
  expected_orders INTEGER NOT NULL DEFAULT 10,
  order_drop_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_downtime BOOLEAN NOT NULL DEFAULT false,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_algorithm_events_worker ON algorithm_events(worker_id);
CREATE INDEX IF NOT EXISTS idx_algorithm_events_city ON algorithm_events(city);
CREATE INDEX IF NOT EXISTS idx_algorithm_events_time ON algorithm_events(recorded_at);
CREATE INDEX IF NOT EXISTS idx_algorithm_events_downtime ON algorithm_events(is_downtime) WHERE is_downtime = true;
