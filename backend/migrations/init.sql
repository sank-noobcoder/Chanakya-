-- ==============================================================================
-- Chanakya Sovereign Mathematical Optimization Solver
-- PostgreSQL Database Initialization & Security Hardening
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('user','engineer','admin')),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  mfa_secret    BYTEA,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Default Sovereign Accounts
INSERT INTO users (id, email, password_hash, role, is_active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'admin@chanakya.gov.in', '$argon2id$v=19$m=65536,t=3,p=4$q6Zp3B2/2w7Dq4iK1yHqXQ$Yf21X+047r6f3RjBvK1+4y8qP3bK5fL8V2h9', 'admin', true),
  ('a0000000-0000-0000-0000-000000000002', 'engineer@iit.ac.in', '$argon2id$v=19$m=65536,t=3,p=4$q6Zp3B2/2w7Dq4iK1yHqXQ$Yf21X+047r6f3RjBvK1+4y8qP3bK5fL8V2h9', 'engineer', true),
  ('a0000000-0000-0000-0000-000000000003', 'analyst@iocl.in', '$argon2id$v=19$m=65536,t=3,p=4$q6Zp3B2/2w7Dq4iK1yHqXQ$Yf21X+047r6f3RjBvK1+4y8qP3bK5fL8V2h9', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash    TEXT NOT NULL,
  scopes      TEXT[] NOT NULL,
  expires_at  TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ
);

-- Rotating refresh tokens with family tracking
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  family_id   UUID NOT NULL,
  is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_family ON refresh_tokens(family_id);

-- Optimization jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES users(id),
  problem_type  TEXT NOT NULL CHECK (problem_type IN ('LP','MILP','QP')),
  status        TEXT NOT NULL CHECK (status IN ('queued','presolving','solving','completed','failed','cancelled','timed_out','numerical_trouble')),
  model_uri     TEXT NOT NULL,
  model_sha256  CHAR(64) NOT NULL,
  params        JSONB NOT NULL,
  result_uri    TEXT,
  objective     DOUBLE PRECISION,
  gap           DOUBLE PRECISION,
  stats         JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_jobs_owner_created ON jobs(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Benchmark runs table
CREATE TABLE IF NOT EXISTS benchmark_runs (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suite     TEXT NOT NULL,
  instance  TEXT NOT NULL,
  solver    TEXT NOT NULL,
  status    TEXT NOT NULL,
  objective DOUBLE PRECISION,
  time_s    DOUBLE PRECISION,
  nodes     BIGINT,
  run_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  actor_id   UUID,
  action     TEXT NOT NULL,
  resource   TEXT,
  ip         VARCHAR(45),
  request_id UUID,
  detail     JSONB,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, at DESC);
