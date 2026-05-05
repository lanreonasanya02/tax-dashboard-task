// @ts-check

/** @typedef {{ id: number, name: string, email: string }} Client */
/** @typedef {{ id: number, client_name: string, amount: number, tax_rate: number, status: 'Paid'|'Unpaid', tax_owed: number }} InvoiceSummary */

const API = {
  clients: "/api/clients",
  summary: "/api/invoices/summary",
  create: "/api/invoices",
  pay: (/** @type {number} */ id) => `/api/invoices/${id}/pay`,
};

const $ = (/** @type {string} */ sel) => {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
};

const clientSelect = /** @type {HTMLSelectElement} */ ($("#client-id"));
const form = /** @type {HTMLFormElement} */ ($("#invoice-form"));
const formError = /** @type {HTMLParagraphElement} */ ($("#form-error"));
const tbody = /** @type {HTMLTableSectionElement} */ ($("#invoices tbody"));

const filterRoot = /** @type {HTMLDivElement} */ ($("#filter"));
const filterBtn = /** @type {HTMLButtonElement} */ ($("#filter-btn"));
const filterLabel = /** @type {HTMLSpanElement} */ ($("#filter-label"));
const filterMenu = /** @type {HTMLUListElement} */ ($("#filter-menu"));

const addClientBtn = /** @type {HTMLButtonElement} */ ($("#add-client-btn"));
const clientDialog = /** @type {HTMLDialogElement} */ ($("#client-dialog"));
const clientForm = /** @type {HTMLFormElement} */ ($("#client-form"));
const clientNameInput = /** @type {HTMLInputElement} */ ($("#client-name"));
const clientEmailInput = /** @type {HTMLInputElement} */ ($("#client-email"));
const clientCancelBtn = /** @type {HTMLButtonElement} */ ($("#client-cancel"));
const clientError = /** @type {HTMLParagraphElement} */ ($("#client-error"));

/** @type {{ clients: Client[], filterClientId: number | null }} */
const state = {
  clients: [],
  filterClientId: null,
};

const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

const percent = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * @param {string} url
 * @param {RequestInit} [init]
 */
async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      data && typeof data.error === "string" ? data.error : res.statusText;
    throw new Error(msg);
  }
  return data;
}

async function loadClients() {
  /** @type {Client[]} */
  const clients = await fetchJson(API.clients);
  state.clients = clients;
  renderClientSelect();
  renderFilterMenu();
  syncFilterLabel();
}

function renderClientSelect() {
  clientSelect.innerHTML = state.clients.length
    ? state.clients
        .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
        .join("")
    : '<option disabled selected>No clients — add one</option>';
}

function renderFilterMenu() {
  const items = [
    { id: null, name: "All Clients" },
    ...state.clients.map((c) => ({ id: c.id, name: c.name })),
  ];
  filterMenu.innerHTML = items
    .map((item) => {
      const selected = item.id === state.filterClientId;
      const value = item.id === null ? "all" : String(item.id);
      return `<li role="option" data-value="${value}" aria-selected="${selected}">${escapeHtml(item.name)}</li>`;
    })
    .join("");
  filterMenu.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", onFilterSelect);
  });
}

function syncFilterLabel() {
  if (state.filterClientId === null) {
    filterLabel.textContent = "All Clients";
    return;
  }
  const found = state.clients.find((c) => c.id === state.filterClientId);
  // Filter target may have been deleted; fall back to "All Clients".
  if (!found) {
    state.filterClientId = null;
    filterLabel.textContent = "All Clients";
    return;
  }
  filterLabel.textContent = found.name;
}

function openFilter() {
  filterMenu.hidden = false;
  filterBtn.setAttribute("aria-expanded", "true");
}

function closeFilter() {
  filterMenu.hidden = true;
  filterBtn.setAttribute("aria-expanded", "false");
}

filterBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (filterMenu.hidden) openFilter();
  else closeFilter();
});

document.addEventListener("click", (e) => {
  if (!filterMenu.hidden && !filterRoot.contains(/** @type {Node} */ (e.target))) {
    closeFilter();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !filterMenu.hidden) closeFilter();
});

async function onFilterSelect(/** @type {Event} */ e) {
  const li = /** @type {HTMLLIElement} */ (e.currentTarget);
  const value = li.dataset.value ?? "all";
  state.filterClientId = value === "all" ? null : Number(value);
  renderFilterMenu();
  syncFilterLabel();
  closeFilter();
  await loadInvoices();
}

async function loadInvoices() {
  const url =
    state.filterClientId === null
      ? API.summary
      : `${API.summary}?client_id=${state.filterClientId}`;
  /** @type {InvoiceSummary[]} */
  const rows = await fetchJson(url);
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td class="empty" colspan="6">No invoices yet</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(renderRow).join("");
  tbody.querySelectorAll("button[data-pay]").forEach((btn) => {
    btn.addEventListener("click", onPayClick);
  });
}

function renderRow(/** @type {InvoiceSummary} */ row) {
  const badge = row.status === "Paid" ? "paid" : "unpaid";
  const action =
    row.status === "Unpaid"
      ? `<button class="secondary" data-pay="${row.id}">Mark as Paid</button>`
      : "";
  return `
    <tr>
      <td>${escapeHtml(row.client_name)}</td>
      <td class="amount">${money.format(row.amount)}</td>
      <td class="rate">${percent.format(row.tax_rate)}%</td>
      <td class="amount">${money.format(row.tax_owed)}</td>
      <td><span class="badge ${badge}">${row.status}</span></td>
      <td>${action}</td>
    </tr>`;
}

async function onPayClick(/** @type {Event} */ e) {
  const target = /** @type {HTMLButtonElement} */ (e.currentTarget);
  const id = Number(target.dataset.pay);
  target.disabled = true;
  try {
    await fetchJson(API.pay(id), { method: "PATCH" });
    await loadInvoices();
  } catch (err) {
    target.disabled = false;
    alert(err instanceof Error ? err.message : "Failed to update invoice");
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;

  const data = new FormData(form);
  const payload = {
    client_id: Number(data.get("client_id")),
    amount: Number(data.get("amount")),
    tax_rate: Number(data.get("tax_rate")),
  };

  try {
    await fetchJson(API.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    form.reset();
    await loadInvoices();
  } catch (err) {
    formError.hidden = false;
    formError.textContent =
      err instanceof Error ? err.message : "Request failed";
  }
});

addClientBtn.addEventListener("click", () => {
  clientError.hidden = true;
  clientForm.reset();
  clientDialog.showModal();
  clientNameInput.focus();
});

clientCancelBtn.addEventListener("click", () => {
  clientDialog.close();
});

clientForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clientError.hidden = true;
  const payload = {
    name: clientNameInput.value.trim(),
    email: clientEmailInput.value.trim(),
  };
  if (!payload.name || !payload.email) {
    clientError.hidden = false;
    clientError.textContent = "Name and email are required";
    return;
  }
  try {
    await fetchJson(API.clients, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    clientDialog.close();
    await loadClients();
  } catch (err) {
    clientError.hidden = false;
    clientError.textContent =
      err instanceof Error ? err.message : "Request failed";
  }
});

function escapeHtml(/** @type {string} */ str) {
  return str.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

await loadClients();
await loadInvoices();

// Mark this file as a module so top-level `await` is valid under @ts-check.
export {};
