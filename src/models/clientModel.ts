import { db } from '../db/database.js';
import type { Client } from './types.js';

const listStmt = db.prepare<[], Client>(
  `SELECT id, name, email, created_at
     FROM clients
    ORDER BY name ASC`,
);

const findByIdStmt = db.prepare<[number], Client>(
  `SELECT id, name, email, created_at
     FROM clients
    WHERE id = ?`,
);

const insertStmt = db.prepare<[string, string]>(
  `INSERT INTO clients (name, email) VALUES (?, ?)`,
);

export const clientModel = {
  list(): Client[] {
    return listStmt.all();
  },

  findById(id: number): Client | undefined {
    return findByIdStmt.get(id);
  },

  insert(name: string, email: string): number {
    const result = insertStmt.run(name, email);
    return Number(result.lastInsertRowid);
  },
};
