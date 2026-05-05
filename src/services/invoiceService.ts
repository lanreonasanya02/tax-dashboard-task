import { clientModel } from '../models/clientModel.js';
import { invoiceModel } from '../models/invoiceModel.js';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceSummaryRow,
} from '../models/types.js';
import { HttpError } from './httpError.js';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseCreateInput(body: unknown): CreateInvoiceInput {
  if (typeof body !== 'object' || body === null) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const { client_id, amount, tax_rate } = body as Record<string, unknown>;

  if (!isFiniteNumber(client_id) || !Number.isInteger(client_id)) {
    throw new HttpError(400, 'client_id must be an integer');
  }
  if (!isFiniteNumber(amount) || amount <= 0) {
    throw new HttpError(400, 'amount must be a positive number');
  }
  if (!isFiniteNumber(tax_rate) || tax_rate < 0) {
    throw new HttpError(400, 'tax_rate must be a number >= 0');
  }
  return { client_id, amount, tax_rate };
}

export const invoiceService = {
  create(body: unknown): Invoice {
    const input = parseCreateInput(body);

    if (!clientModel.findById(input.client_id)) {
      throw new HttpError(404, `Client ${input.client_id} not found`);
    }

    const id = invoiceModel.insert(input, 'Unpaid');
    const created = invoiceModel.findById(id);
    if (!created) {
      throw new HttpError(500, 'Failed to load created invoice');
    }
    return created;
  },

  markPaid(id: number): Invoice {
    const existing = invoiceModel.findById(id);
    if (!existing) {
      throw new HttpError(404, `Invoice ${id} not found`);
    }
    if (existing.status === 'Paid') {
      return existing; // idempotent
    }
    invoiceModel.updateStatus(id, 'Paid');
    return { ...existing, status: 'Paid' };
  },

  summary(clientId?: number): InvoiceSummaryRow[] {
    return invoiceModel.summary(clientId);
  },
};
