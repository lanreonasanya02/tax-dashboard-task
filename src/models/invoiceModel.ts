import { db } from '../db/database.js';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceStatus,
  InvoiceSummaryRow,
} from './types.js';

const insertStmt = db.prepare<[number, number, number, InvoiceStatus]>(
  `INSERT INTO invoices (client_id, amount, tax_rate, status)
   VALUES (?, ?, ?, ?)`,
);

const findByIdStmt = db.prepare<[number], Invoice>(
  `SELECT id, client_id, amount, tax_rate, status, created_at
     FROM invoices
    WHERE id = ?`,
);

const updateStatusStmt = db.prepare<[InvoiceStatus, number]>(
  `UPDATE invoices SET status = ? WHERE id = ?`,
);

const SUMMARY_SELECT = `
  SELECT i.id            AS id,
         c.name          AS client_name,
         i.amount        AS amount,
         i.tax_rate      AS tax_rate,
         i.status        AS status,
         ROUND(i.amount * (i.tax_rate / 100.0), 2) AS tax_owed
    FROM invoices i
    JOIN clients  c ON c.id = i.client_id
`;

const summaryStmt = db.prepare<[], InvoiceSummaryRow>(
  `${SUMMARY_SELECT} ORDER BY i.created_at DESC, i.id DESC`,
);

const summaryByClientStmt = db.prepare<[number], InvoiceSummaryRow>(
  `${SUMMARY_SELECT} WHERE i.client_id = ? ORDER BY i.created_at DESC, i.id DESC`,
);

export const invoiceModel = {
  insert(input: CreateInvoiceInput, status: InvoiceStatus): number {
    const result = insertStmt.run(
      input.client_id,
      input.amount,
      input.tax_rate,
      status,
    );
    return Number(result.lastInsertRowid);
  },

  findById(id: number): Invoice | undefined {
    return findByIdStmt.get(id);
  },

  updateStatus(id: number, status: InvoiceStatus): boolean {
    return updateStatusStmt.run(status, id).changes > 0;
  },

  summary(clientId?: number): InvoiceSummaryRow[] {
    return clientId === undefined
      ? summaryStmt.all()
      : summaryByClientStmt.all(clientId);
  },
};
