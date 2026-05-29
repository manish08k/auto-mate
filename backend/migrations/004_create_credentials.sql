-- ============================================================
-- Migration 004 — Create Credentials table
-- Run order: AFTER 001 (references users)
-- ============================================================

CREATE TABLE IF NOT EXISTS credentials (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id           UUID        NOT NULL
                                REFERENCES users(id) ON DELETE CASCADE,

  -- User-friendly label e.g. "Work Gmail", "Company Slack"
  name              VARCHAR(100) NOT NULL,

  service           VARCHAR(30) NOT NULL
                                CHECK (service IN (
                                  'google','slack','meta','github',
                                  'telegram','whatsapp','openai',
                                  'razorpay','custom'
                                )),

  auth_type         VARCHAR(20) NOT NULL
                                CHECK (auth_type IN ('oauth2','api_key','basic')),

  -- AES-256-GCM encrypted: format  iv:authTag:ciphertext
  access_token      TEXT,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,

  -- Encrypted JSON blob for api_key / basic auth
  -- e.g. encrypt('{"apiKey":"sk-..."}')  or  encrypt('{"username":"x","password":"y"}')
  secret_data       TEXT,

  -- Non-sensitive display info stored in plaintext
  -- e.g. { "email": "user@gmail.com", "scopes": ["gmail.send"], "workspace": "MyTeam" }
  meta              JSONB       NOT NULL DEFAULT '{}',

  is_valid          BOOLEAN     NOT NULL DEFAULT TRUE,
  last_used_at      TIMESTAMPTZ,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_credentials_user_id         ON credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user_service    ON credentials (user_id, service);
CREATE INDEX IF NOT EXISTS idx_credentials_is_valid        ON credentials (is_valid);
CREATE INDEX IF NOT EXISTS idx_credentials_token_expires   ON credentials (token_expires_at)
  WHERE token_expires_at IS NOT NULL;    -- partial index — only rows that can expire

-- ─── Auto-update updated_at ───────────────────────────────────────

CREATE TRIGGER set_updated_at_credentials
  BEFORE UPDATE ON credentials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ─── Constraint: max credentials per user (enforced at app layer too) ─
-- Postgres doesn't support per-row count limits natively.
-- This is handled in the credential controller + plan limit checks.
-- Reminder: enforce via: SELECT COUNT(*) FROM credentials WHERE user_id = $1

-- ─── View: expired tokens (useful for background refresh job) ─────

CREATE OR REPLACE VIEW credentials_expiring_soon AS
  SELECT
    c.id,
    c.user_id,
    c.service,
    c.name,
    c.token_expires_at,
    u.email AS user_email
  FROM credentials c
  JOIN users       u ON u.id = c.user_id
  WHERE
    c.auth_type      = 'oauth2'
    AND c.is_valid   = TRUE
    AND c.token_expires_at IS NOT NULL
    AND c.token_expires_at < NOW() + INTERVAL '10 minutes'
  ORDER BY c.token_expires_at ASC;

COMMENT ON VIEW credentials_expiring_soon IS
  'OAuth tokens expiring within 10 minutes — poll this to proactively refresh tokens before workflows fail.';
