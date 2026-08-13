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

-- Public announcements (auto-posted when a Prasadam draw happens, and any manual notices)
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);
