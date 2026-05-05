export type InvoiceStatus = 'Paid' | 'Unpaid';

export interface Client {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  client_id: number;
  amount: number;
  tax_rate: number;
  status: InvoiceStatus;
  created_at: string;
}

export interface InvoiceSummaryRow {
  id: number;
  client_name: string;
  amount: number;
  tax_rate: number;
  status: InvoiceStatus;
  tax_owed: number;
}

export interface CreateInvoiceInput {
  client_id: number;
  amount: number;
  tax_rate: number;
}
