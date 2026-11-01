import Database from 'better-sqlite3';

export type Db = Database.Database;

// Opens the database and makes sure the tables exist.
// Use ':memory:' in tests.
export function openDb(path: string): Db {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS button_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      pressed    INTEGER NOT NULL CHECK (pressed IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS button_state (
      id         INTEGER PRIMARY KEY CHECK (id = 1),
      pressed    INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    INSERT OR IGNORE INTO button_state (id, pressed, updated_at)
      VALUES (1, 0, datetime('now'));
  `);
  return db;
}
