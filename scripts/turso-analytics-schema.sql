CREATE TABLE IF NOT EXISTS analytics_events (
  event_id TEXT PRIMARY KEY,
  event_version INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  received_at TEXT NOT NULL,
  merchant_id TEXT,
  experience_id TEXT,
  store_id TEXT,
  campaign_id TEXT,
  session_id TEXT,
  anonymous_actor_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS analytics_events_occurred_at_idx
  ON analytics_events (occurred_at);

CREATE INDEX IF NOT EXISTS analytics_events_merchant_occurred_at_idx
  ON analytics_events (merchant_id, occurred_at);

CREATE INDEX IF NOT EXISTS analytics_events_campaign_occurred_at_idx
  ON analytics_events (campaign_id, occurred_at);

CREATE INDEX IF NOT EXISTS analytics_events_type_occurred_at_idx
  ON analytics_events (event_type, occurred_at);
