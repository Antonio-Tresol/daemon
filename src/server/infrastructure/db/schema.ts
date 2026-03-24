export const CREATE_EVENTS_TABLE = `
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  event_type TEXT NOT NULL,
  tool_name TEXT,
  success INTEGER,
  duration_ms INTEGER,
  prompt_id TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (session_id) REFERENCES sessions(id)
)`;

export const CREATE_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  start_time TEXT NOT NULL,
  end_time TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  cwd TEXT,
  project_hash TEXT,
  total_events INTEGER NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0
)`;

export const CREATE_ANALYSES_TABLE = `
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  triggered_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result TEXT,
  error TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
)`;

export const CREATE_OTEL_METRICS_TABLE = `
CREATE TABLE IF NOT EXISTS otel_metrics (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  timestamp TEXT NOT NULL,
  attributes TEXT NOT NULL DEFAULT '{}'
)`;

export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id)',
  'CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status)',
  'CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON analyses(session_id)',
  'CREATE INDEX IF NOT EXISTS idx_analyses_type ON analyses(analysis_type)',
  'CREATE INDEX IF NOT EXISTS idx_otel_metrics_session_id ON otel_metrics(session_id)',
  'CREATE INDEX IF NOT EXISTS idx_otel_metrics_timestamp ON otel_metrics(timestamp)',
];
