-- ============================================================
-- Migration 003 — Create Executions table
-- Run order: AFTER 002 (references users + workflows)
-- ============================================================

CREATE TABLE IF NOT EXISTS executions (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  workflow_id      UUID        NOT NULL
                               REFERENCES workflows(id) ON DELETE CASCADE,

  user_id          UUID        NOT NULL
                               REFERENCES users(id) ON DELETE CASCADE,

  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','running','success','failed','cancelled')),

  trigger_type     VARCHAR(20) NOT NULL
                               CHECK (trigger_type IN ('webhook','schedule','manual')),

  -- Raw data that triggered this run (webhook body, schedule meta, manual input)
  trigger_data     JSONB       NOT NULL DEFAULT '{}',

  -- Per-node results keyed by node ID:
  -- { "nodeId": { "status": "success", "output": {}, "error": null, "duration_ms": 120 } }
  node_results     JSONB       NOT NULL DEFAULT '{}',

  -- Final output of the last node in the workflow
  output           JSONB,

  -- Error details (populated on failure)
  error_message    TEXT,
  failed_node_id   VARCHAR(100),

  -- Timing
  started_at       TIMESTAMPTZ,
  finished_at      TIMESTAMPTZ,
  duration_ms      INT,

  -- BullMQ job ID for cross-referencing queue logs
  queue_job_id     VARCHAR(100),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_executions_workflow_id  ON executions (workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_user_id      ON executions (user_id);
CREATE INDEX IF NOT EXISTS idx_executions_status       ON executions (status);
CREATE INDEX IF NOT EXISTS idx_executions_trigger_type ON executions (trigger_type);
CREATE INDEX IF NOT EXISTS idx_executions_created_at   ON executions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_started_at   ON executions (started_at DESC);

-- Composite: most common query — "all executions for workflow X, newest first"
CREATE INDEX IF NOT EXISTS idx_executions_workflow_created
  ON executions (workflow_id, created_at DESC);

-- Composite: dashboard query — "all failed executions for user X"
CREATE INDEX IF NOT EXISTS idx_executions_user_status
  ON executions (user_id, status);

-- GIN for querying inside node_results JSON (e.g. find executions where a specific node failed)
CREATE INDEX IF NOT EXISTS idx_executions_node_results_gin
  ON executions USING GIN (node_results);

-- ─── Auto-update updated_at ───────────────────────────────────────

CREATE TRIGGER set_updated_at_executions
  BEFORE UPDATE ON executions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Auto-compute duration_ms on finish ──────────────────────────

CREATE OR REPLACE FUNCTION trigger_compute_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.finished_at IS NOT NULL AND NEW.started_at IS NOT NULL AND NEW.duration_ms IS NULL THEN
    NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.finished_at - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_execution_duration
  BEFORE UPDATE ON executions
  FOR EACH ROW EXECUTE FUNCTION trigger_compute_duration();

-- ─── Partition hint (for high-volume deployments) ─────────────────
-- If executions table grows > 10M rows, consider partitioning by month:
--
-- CREATE TABLE executions_2025_01 PARTITION OF executions
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
--
-- Requires converting the table to PARTITION BY RANGE (created_at)
