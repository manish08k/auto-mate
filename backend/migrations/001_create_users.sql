-- ============================================================
-- Migration 001 — Create Users & Plans tables
-- Run order: FIRST (plans must exist before users references it)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Enable case-insensitive text (used for email index)
CREATE EXTENSION IF NOT EXISTS "citext";

-- ─── Plans ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plans (
  id                            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),

  name                          VARCHAR(50)   NOT NULL UNIQUE,     -- "free" | "starter" | "pro" | "enterprise"
  display_name                  VARCHAR(100)  NOT NULL,            -- shown on pricing page
  price_monthly                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly                  NUMERIC(10,2),

  -- Hard usage limits
  max_workflows                 INT           NOT NULL DEFAULT 3,
  max_executions_per_month      INT           NOT NULL DEFAULT 100,
  max_credentials               INT           NOT NULL DEFAULT 2,
  min_schedule_interval_minutes INT           NOT NULL DEFAULT 60,

  -- Feature flags array  e.g. ARRAY['webhook_trigger','openai']
  features                      TEXT[]        NOT NULL DEFAULT '{}',

  -- Billing provider IDs
  razorpay_plan_id              VARCHAR(100),
  stripe_price_id               VARCHAR(100),

  is_active                     BOOLEAN       NOT NULL DEFAULT TRUE,
  is_public                     BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order                    INT           NOT NULL DEFAULT 0,

  created_at                    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Users ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  name             VARCHAR(100) NOT NULL,
  email            CITEXT       NOT NULL UNIQUE,          -- case-insensitive unique
  password_hash    TEXT,                                  -- NULL for OAuth-only users
  avatar_url       TEXT,

  plan_id          UUID         REFERENCES plans(id) ON DELETE SET NULL,

  is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,

  -- OAuth fields
  oauth_provider   VARCHAR(20)  CHECK (oauth_provider IN ('google','github','slack')),
  oauth_id         VARCHAR(255),

  last_login_at    TIMESTAMPTZ,
  timezone         VARCHAR(50)  NOT NULL DEFAULT 'UTC',

  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_email        ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_plan_id      ON users (plan_id);
CREATE INDEX IF NOT EXISTS idx_users_oauth        ON users (oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active    ON users (is_active);

-- ─── Auto-update updated_at ───────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Seed default plans ───────────────────────────────────────────

INSERT INTO plans (name, display_name, price_monthly, price_yearly, max_workflows, max_executions_per_month, max_credentials, min_schedule_interval_minutes, features, is_active, is_public, sort_order)
VALUES
  (
    'free', 'Free', 0, 0,
    3, 100, 2, 60,
    ARRAY['manual_trigger', 'webhook_trigger'],
    TRUE, TRUE, 1
  ),
  (
    'starter', 'Starter', 9.00, 90.00,
    10, 1000, 5, 15,
    ARRAY['manual_trigger', 'webhook_trigger', 'schedule_trigger', 'http_request', 'gmail', 'slack'],
    TRUE, TRUE, 2
  ),
  (
    'pro', 'Pro', 29.00, 290.00,
    50, 10000, 20, 5,
    ARRAY['manual_trigger', 'webhook_trigger', 'schedule_trigger', 'http_request', 'gmail', 'slack', 'whatsapp', 'telegram', 'google_sheets', 'openai', 'razorpay'],
    TRUE, TRUE, 3
  ),
  (
    'enterprise', 'Enterprise', 99.00, 990.00,
    999, 999999, 999, 1,
    ARRAY['manual_trigger', 'webhook_trigger', 'schedule_trigger', 'http_request', 'gmail', 'slack', 'whatsapp', 'telegram', 'google_sheets', 'openai', 'razorpay', 'priority_support', 'custom_nodes', 'audit_logs'],
    TRUE, FALSE, 4
  )
ON CONFLICT (name) DO NOTHING;
