CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  donation TEXT,
  created_at TEXT NOT NULL,
  cycle_status TEXT NOT NULL DEFAULT 'pending', -- pending | won
  won_at TEXT
);
