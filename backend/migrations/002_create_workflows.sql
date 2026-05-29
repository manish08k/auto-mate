-- ============================================================
-- Migration 002 — Create Workflows table
-- Run order: AFTER 001 (references users)
-- ============================================================

CREATE TABLE IF NOT EXISTS workflows (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id           UUID        NOT NULL
                                REFERENCES users(id) ON DELETE CASCADE,

  name              VARCHAR(150) NOT NULL,
  description       TEXT,

  -- Full canvas state: { nodes: [...], edges: [...], viewport: {} }
  definition        JSONB       NOT NULL DEFAULT '{"nodes":[],"edges":[],"viewport":{}}',

  is_active         BOOLEAN     NOT NULL DEFAULT FALSE,

  trigger_type      VARCHAR(20) NOT NULL DEFAULT 'manual'
                                CHECK (trigger_type IN ('webhook','schedule','manual')),

  -- Webhook trigger
  webhook_id        UUID        UNIQUE,               -- used in /webhook/:webhook_id URL

  -- Schedule trigger — standard 5-part cron string e.g. "0 9 * * 1"
  cron_expression   VARCHAR(100),

  -- Stats
  last_run_at       TIMESTAMPTZ,
  last_run_status   VARCHAR(20) CHECK (last_run_status IN ('success','failed','running')),
  run_count         INT         NOT NULL DEFAULT 0,

  tags              TEXT[]      NOT NULL DEFAULT '{}',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_workflows_user_id        ON workflows (user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_active      ON workflows (is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type   ON workflows (trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflows_webhook_id     ON workflows (webhook_id);
CREATE INDEX IF NOT EXISTS idx_workflows_last_run_at    ON workflows (last_run_at DESC);

-- GIN index for fast JSONB queries on definition (e.g. find workflows using a specific node type)
CREATE INDEX IF NOT EXISTS idx_workflows_definition_gin ON workflows USING GIN (definition);

-- GIN index for tag-based filtering
CREATE INDEX IF NOT EXISTS idx_workflows_tags_gin       ON workflows USING GIN (tags);

-- ─── Auto-update updated_at ───────────────────────────────────────

CREATE TRIGGER set_updated_at_workflows
  BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Constraint: cron_expression required when trigger is schedule ─

ALTER TABLE workflows
  ADD CONSTRAINT chk_schedule_has_cron
  CHECK (
    trigger_type != 'schedule' OR cron_expression IS NOT NULL
  );

-- ─── Constraint: webhook_id required when trigger is webhook ──────

ALTER TABLE workflows
  ADD CONSTRAINT chk_webhook_has_id
  CHECK (
    trigger_type != 'webhook' OR webhook_id IS NOT NULL
  );
