import { db, migrate } from "../src/db/database.js";
import { clientModel } from "../src/models/clientModel.js";
import { invoiceModel } from "../src/models/invoiceModel.js";
import type { CreateInvoiceInput, InvoiceStatus } from "../src/models/types.js";

migrate();

const seed = db.transaction(() => {
  db.exec("DELETE FROM invoices; DELETE FROM clients;");
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('invoices','clients');");

  const lanre = clientModel.insert("Lanre Adeolu", "lanreadeolu@gmail.com");
  const oakwood = clientModel.insert("Oakwood Stack", "hello@oakwoodstack.com");

  const invoices: Array<CreateInvoiceInput & { status: InvoiceStatus }> = [
    { client_id: lanre, amount: 1500, tax_rate: 7.5, status: "Unpaid" },
    { client_id: lanre, amount: 2750, tax_rate: 7.5, status: "Paid" },
    { client_id: lanre, amount: 980, tax_rate: 5, status: "Paid" },
    { client_id: lanre, amount: 4200, tax_rate: 10, status: "Unpaid" },
    { client_id: lanre, amount: 3300, tax_rate: 7.5, status: "Paid" },

    { client_id: oakwood, amount: 2200, tax_rate: 7.5, status: "Paid" },
    { client_id: oakwood, amount: 5400, tax_rate: 7.5, status: "Unpaid" },
    { client_id: oakwood, amount: 1800, tax_rate: 5, status: "Paid" },
    { client_id: oakwood, amount: 6750, tax_rate: 10, status: "Unpaid" },
    { client_id: oakwood, amount: 3100, tax_rate: 7.5, status: "Paid" },
  ];

  for (const { status, ...input } of invoices) {
    invoiceModel.insert(input, status);
  }
});

seed();

console.log("Seeded 2 clients and 10 invoices.");
