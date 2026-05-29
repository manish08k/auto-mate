-- ================================================================
--  schema.sql — FlowApp Complete Database Schema
--  This is the canonical reference. For fresh installs, run the
--  numbered migration files in order instead.
--  postgres -U postgres -d flowapp -f database/schema.sql
-- ================================================================

-- ── Extensions ───────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ── Shared trigger function ───────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
--  PLANS
-- ================================================================

CREATE TABLE IF NOT EXISTS plans (
  id                            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                          VARCHAR(50)   NOT NULL UNIQUE,
  display_name                  VARCHAR(100)  NOT NULL,
  price_monthly                 NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly                  NUMERIC(10,2),
  max_workflows                 INT           NOT NULL DEFAULT 3,
  max_executions_per_month      INT           NOT NULL DEFAULT 100,
  max_credentials               INT           NOT NULL DEFAULT 2,
  min_schedule_interval_minutes INT           NOT NULL DEFAULT 60,
  features                      TEXT[]        NOT NULL DEFAULT '{}',
  razorpay_plan_id              VARCHAR(100),
  stripe_price_id               VARCHAR(100),
  is_active                     BOOLEAN       NOT NULL DEFAULT TRUE,
  is_public                     BOOLEAN       NOT NULL DEFAULT TRUE,
  sort_order                    INT           NOT NULL DEFAULT 0,
  created_at                    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ================================================================
--  USERS
-- ================================================================

CREATE TABLE IF NOT EXISTS users (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             VARCHAR(100) NOT NULL,
  email            CITEXT       NOT NULL UNIQUE,
  password_hash    TEXT,
  avatar_url       TEXT,
  plan_id          UUID         REFERENCES plans(id) ON DELETE SET NULL,
  is_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  oauth_provider   VARCHAR(20)  CHECK (oauth_provider IN ('google','github','slack')),
  oauth_id         VARCHAR(255),
  last_login_at    TIMESTAMPTZ,
  timezone         VARCHAR(50)  NOT NULL DEFAULT 'UTC',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_plan_id   ON users (plan_id);
CREATE INDEX IF NOT EXISTS idx_users_oauth     ON users (oauth_provider, oauth_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users (is_active);

CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ================================================================
--  WORKFLOWS
-- ================================================================

CREATE TABLE IF NOT EXISTS workflows (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(150) NOT NULL,
  description       TEXT,
  definition        JSONB        NOT NULL DEFAULT '{"nodes":[],"edges":[],"viewport":{}}',
  is_active         BOOLEAN      NOT NULL DEFAULT FALSE,
  trigger_type      VARCHAR(20)  NOT NULL DEFAULT 'manual'
                                 CHECK (trigger_type IN ('webhook','schedule','manual')),
  webhook_id        UUID         UNIQUE,
  cron_expression   VARCHAR(100),
  last_run_at       TIMESTAMPTZ,
  last_run_status   VARCHAR(20)  CHECK (last_run_status IN ('success','failed','running')),
  run_count         INT          NOT NULL DEFAULT 0,
  tags              TEXT[]       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_schedule_has_cron  CHECK (trigger_type != 'schedule' OR cron_expression IS NOT NULL),
  CONSTRAINT chk_webhook_has_id     CHECK (trigger_type != 'webhook'  OR webhook_id      IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id       ON workflows (user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active     ON workflows (is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type  ON workflows (trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_webhook_id    ON workflows (webhook_id);
CREATE INDEX IF NOT EXISTS idx_workflows_last_run_at   ON workflows (last_run_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_definition_gin ON workflows USING GIN (definition);
CREATE INDEX IF NOT EXISTS idx_workflows_tags_gin       ON workflows USING GIN (tags);

CREATE TRIGGER set_updated_at_workflows
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ================================================================
--  EXECUTIONS
-- ================================================================

CREATE TABLE IF NOT EXISTS executions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id      UUID        NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','running','success','failed','cancelled')),
  trigger_type     VARCHAR(20) NOT NULL
                               CHECK (trigger_type IN ('webhook','schedule','manual')),
  trigger_data     JSONB       NOT NULL DEFAULT '{}',
  node_results     JSONB       NOT NULL DEFAULT '{}',
  output           JSONB,
  error_message    TEXT,
  failed_node_id   VARCHAR(100),
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ,
  duration_ms      INT,
  queue_job_id     VARCHAR(100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_executions_workflow_id     ON executions (workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_user_id         ON executions (user_id);
CREATE INDEX IF NOT EXISTS idx_executions_status          ON executions (status);
CREATE INDEX IF NOT EXISTS idx_executions_trigger_type    ON executions (trigger_type);
CREATE INDEX IF NOT EXISTS idx_executions_created_at      ON executions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_workflow_created ON executions (workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_user_status     ON executions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_executions_node_results_gin ON executions USING GIN (node_results);

CREATE OR REPLACE FUNCTION trigger_compute_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL AND NEW.duration_ms IS NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_executions
  BEFORE UPDATE ON executions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER compute_execution_duration
  BEFORE UPDATE ON executions
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_duration();

-- ================================================================
--  CREDENTIALS
-- ================================================================

CREATE TABLE IF NOT EXISTS credentials (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  service           VARCHAR(30)  NOT NULL
                                 CHECK (service IN ('google','slack','meta','github','telegram','whatsapp','openai','razorpay','custom')),
  auth_type         VARCHAR(20)  NOT NULL
                                 CHECK (auth_type IN ('oauth2','api_key','basic')),
  access_token      TEXT,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,
  secret_data       TEXT,
  meta              JSONB        NOT NULL DEFAULT '{}',
  is_valid          BOOLEAN      NOT NULL DEFAULT TRUE,
  last_used_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id       ON credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user_service  ON credentials (user_id, service);
CREATE INDEX IF NOT EXISTS idx_credentials_is_valid      ON credentials (is_valid);
CREATE INDEX IF NOT EXISTS idx_credentials_token_expires ON credentials (token_expires_at)
  WHERE token_expires_at IS NOT NULL;

CREATE TRIGGER set_updated_at_credentials
  BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ================================================================
--  VIEWS
-- ================================================================

CREATE OR REPLACE VIEW credentials_expiring_soon AS
  SELECT c.id, c.user_id, c.service, c.name, c.token_expires_at, u.email AS user_email
  FROM   credentials c
  JOIN   users u ON u.id = c.user_id
  WHERE  c.auth_type = 'oauth2'
    AND  c.is_valid = TRUE
    AND  c.token_expires_at IS NOT NULL
    AND  c.token_expires_at < NOW() + INTERVAL '10 minutes'
  ORDER BY c.token_expires_at ASC;

CREATE OR REPLACE VIEW workflow_stats AS
  SELECT
    w.id              AS workflow_id,
    w.user_id,
    w.name,
    w.is_active,
    w.run_count,
    w.last_run_at,
    w.last_run_status,
    COUNT(e.id)                                                          AS total_executions,
    COUNT(e.id) FILTER (WHERE e.status = 'success')                      AS successful_executions,
    COUNT(e.id) FILTER (WHERE e.status = 'failed')                       AS failed_executions,
    ROUND(AVG(e.duration_ms) FILTER (WHERE e.status = 'success'))::INT   AS avg_duration_ms,
    MAX(e.created_at)                                                    AS last_execution_at
  FROM workflows w
  LEFT JOIN executions e ON e.workflow_id = w.id
  GROUP BY w.id;

-- ================================================================
--  SEED DATA
-- ================================================================

INSERT INTO plans (name, display_name, price_monthly, price_yearly, max_workflows, max_executions_per_month, max_credentials, min_schedule_interval_minutes, features, sort_order)
VALUES
  ('free',       'Free',       0,     0,    3,  100,    2,  60, ARRAY['manual_trigger','webhook_trigger'], 1),
  ('starter',    'Starter',    9.00,  90,   10, 1000,   5,  15, ARRAY['manual_trigger','webhook_trigger','schedule_trigger','http_request','gmail','slack'], 2),
  ('pro',        'Pro',        29.00, 290,  50, 10000,  20, 5,  ARRAY['manual_trigger','webhook_trigger','schedule_trigger','http_request','gmail','slack','whatsapp','telegram','google_sheets','openai','razorpay'], 3),
  ('enterprise', 'Enterprise', 99.00, 990,  999,999999, 999,1,  ARRAY['manual_trigger','webhook_trigger','schedule_trigger','http_request','gmail','slack','whatsapp','telegram','google_sheets','openai','razorpay','priority_support','custom_nodes','audit_logs'], 4)
ON CONFLICT (name) DO NOTHING;