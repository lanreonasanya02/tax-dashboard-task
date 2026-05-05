import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH ?? resolve(__dirname, '../../data.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      amount     REAL    NOT NULL CHECK (amount > 0),
      tax_rate   REAL    NOT NULL CHECK (tax_rate >= 0),
      status     TEXT    NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Paid','Unpaid')),
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
  `);
}

// Run schema setup at import time so models can prepare statements safely.
migrate();
