CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  activation_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  customer_note TEXT,
  installation_id TEXT,
  activated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
