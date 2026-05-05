# Tax & Invoice Dashboard

A minimal full-stack mini-app: Express + TypeScript + SQLite on the backend, vanilla JS on the frontend. Currency is rendered in Nigerian Naira (NGN).

## Stack

- **Backend** — Node.js, Express, TypeScript (strict)
- **Database** — SQLite via `better-sqlite3` (synchronous, file-backed)
- **Frontend** — Vanilla JS module + plain CSS, served as static files (no build step, no framework)

## Project structure

```
.
├── public/                  Frontend SPA (HTML, CSS, JS)
├── scripts/
│   └── seed.ts              Seeds 2 clients + 10 sample invoices
└── src/
    ├── db/database.ts       SQLite connection + schema migration (auto-runs on import)
    ├── models/              Typed data accessors (prepared statements)
    ├── services/            Validation + business rules (tax math)
    ├── controllers/         Express request handlers (thin)
    ├── routes/              Route definitions
    ├── app.ts               Express app factory + error middleware
    └── server.ts            Bootstraps migration and starts the listener
```

## Setup

```bash
npm install
npm run seed     # creates data.db with 2 clients + 10 invoices
npm run dev      # starts http://localhost:3000
```

Open <http://localhost:3000> in your browser.

## Scripts

| Command             | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Run the API + serve the frontend (watch mode) |
| `npm run build`     | Compile to `dist/` via `tsconfig.build.json`  |
| `npm start`         | Run the compiled build                        |
| `npm run seed`      | Reset DB and insert sample data               |
| `npm run typecheck` | Type-check everything without emitting        |

## API

| Method | Path                       | Description                                                  |
| ------ | -------------------------- | ------------------------------------------------------------ |
| GET    | `/api/clients`             | List all clients                                             |
| POST   | `/api/clients`             | Create a client (`name`, `email` — both required, non-empty) |
| POST   | `/api/invoices`            | Create invoice (validates `amount > 0`, `tax_rate >= 0`)     |
| GET    | `/api/invoices/summary`    | Invoice rows joined with client + computed `tax_owed`. Optional `?client_id=N` filter. |
| PATCH  | `/api/invoices/:id/pay`    | Mark invoice as Paid (idempotent)                            |

### POST /api/clients

```json
{ "name": "New Co", "email": "hello@new.co" }
```

Returns the created client (HTTP 201). Whitespace is trimmed; empty fields return `400`.

### POST /api/invoices

```json
{ "client_id": 1, "amount": 1500, "tax_rate": 7.5 }
```

Returns the created invoice with `status: "Unpaid"` (HTTP 201).

### GET /api/invoices/summary

Returns all invoices joined with their client name and a server-computed `tax_owed`:

```json
[
  {
    "id": 1,
    "client_name": "Lanre Adeolu",
    "amount": 1500,
    "tax_rate": 7.5,
    "status": "Unpaid",
    "tax_owed": 112.5
  }
]
```

Pass `?client_id=N` to scope to a single client:

```
GET /api/invoices/summary?client_id=2
```

### PATCH /api/invoices/:id/pay

Marks the invoice as Paid and returns the updated row. Calling it on an already-Paid invoice is a no-op (still `200`). Unknown id returns `404`.

## Frontend features

- **Invoice creation form** — pick a client, enter amount and tax rate, submit. Page does not reload; the table refreshes via `fetch`.
- **Add Client** — opens a modal (native `<dialog>`) for name + email, posts to `POST /api/clients`, and refreshes the client dropdown _and_ the filter list immediately.
- **Filter button** — defaults to "All Clients". Click it to open a list of clients; selecting one re-fetches `/api/invoices/summary?client_id=N` and updates the button label.
- **Invoice table** — columns: Client · Amount · Tax Rate · Tax Owed · Status, with a "Mark as Paid" action on unpaid rows.
- **Currency formatting** — NGN via `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`.

## Design notes

- **Layered architecture** — controllers handle HTTP only, services own validation and business rules, models are pure data accessors with prepared statements. Easy to test each tier in isolation.
- **Defense in depth on validation** — service layer rejects bad input with `HttpError`, and SQLite `CHECK` constraints enforce the same rules at the DB layer (`amount > 0`, `tax_rate >= 0`, `status IN ('Paid','Unpaid')`).
- **Typed end-to-end** — `strict`, `noUncheckedIndexedAccess`, no `any`. The frontend uses `// @ts-check` with JSDoc so browser code is type-checked too.
- **Two tsconfigs** — `tsconfig.json` is `noEmit` and type-checks both `src/` and `scripts/`. `tsconfig.build.json` extends it, narrows include to `src/`, and emits to `dist/`.
- **No build step for the frontend** — served directly by Express, so there's one process and no CORS to configure.
- **Auto-migrate on connect** — `src/db/database.ts` runs `migrate()` at import time, so any consumer (server or seed) gets a ready schema.
