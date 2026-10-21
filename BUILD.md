# BUILD.md — Vehicle Rental & Fleet Management System
> ⚠️ AGENT INSTRUCTIONS: Build ONLY what is listed here. Do not add features, do not infer requirements, do not improve on the spec. If something is unclear, output a comment `// UNCLEAR: [question]` and stop. Do not proceed past unclear points.

## Project Overview
A staff-only, database-oriented web app for a vehicle rental business (DBMS college mini project, 3-person team). Staff manage vehicles, customers, bookings, payments, maintenance and fuel logs. **All business rules are enforced inside PostgreSQL** (constraints, triggers, functions, views); the Next.js API only runs SQL and passes DB errors through. There is no customer-facing side.

Reference project: github.com/Pranav1632/transitops_odoo (TransitOps). Borrowed ideas: 3-module split, status lifecycle driven by DB triggers, maintenance ↔ vehicle availability link, aggregates via DB functions/views, no `SELECT *`, pooled DB connection. Everything else from TransitOps (Redis, BullMQ, Socket.io, Pino, Supabase, Tailwind, shadcn, Recharts, Framer Motion, TypeScript, Express) is **out of scope**.

## Database layer status (READ THIS)
The whole database layer is **already written and tested** in `db/`: `schema.sql`, `triggers_vehicle.sql`, `triggers_booking.sql`, `triggers_maintenance.sql`, `views.sql`, `seed_a/b/c.sql`, `queries_a/b/c.sql`, `reset.sh`, `tests.sql`. Everyone starts from the same structure. `bash db/reset.sh` builds it from scratch and `psql ... -f db/tests.sql` runs 21 automated checks (all pass on PostgreSQL 16). Do not rewrite these files; if a rule must change, edit BUILD.md first, then the SQL, then re-run the tests.

## Tech Stack
| Layer | Exact choice |
|---|---|
| Database | PostgreSQL 15+ (local), extensions: `btree_gist`, `pgcrypto` |
| Backend | Next.js 14 App Router **route handlers** (`src/app/api/**/route.js`), JavaScript (no TypeScript) |
| DB driver | `pg` (single `Pool`), raw parameterised SQL only. **No ORM.** |
| Frontend | Next.js 14 App Router pages (JavaScript), React 18, plain CSS (`globals.css`) — see `DESIGN.md` |
| Auth | `bcryptjs` (password check) + `jose` (HS256 JWT in httpOnly cookie `session`, 8h expiry) |
| Node | 20+ |

**Allowed npm packages (complete list):** `next@14`, `react@18`, `react-dom@18`, `pg`, `bcryptjs`, `jose`. Nothing else may be installed.

## Shared Contracts (ALL agents must honor these)

### Database schema (frozen — file `db/schema.sql`, owned by Person A)
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  user_id       SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin','staff'))
);

CREATE TABLE vehicle_categories (
  category_id SERIAL PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,
  daily_rate  NUMERIC(10,2) NOT NULL CHECK (daily_rate > 0)
);

CREATE TABLE vehicles (
  vehicle_id  SERIAL PRIMARY KEY,
  plate_no    VARCHAR(15) NOT NULL UNIQUE,
  make        VARCHAR(50) NOT NULL,
  model       VARCHAR(50) NOT NULL,
  year        INT NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  category_id INT NOT NULL REFERENCES vehicle_categories(category_id) ON DELETE RESTRICT,
  odometer_km INT NOT NULL DEFAULT 0 CHECK (odometer_km >= 0),
  status      VARCHAR(10) NOT NULL DEFAULT 'Available'
              CHECK (status IN ('Available','Rented','In Shop','Retired'))
);

CREATE TABLE customers (
  customer_id    SERIAL PRIMARY KEY,
  full_name      VARCHAR(100) NOT NULL,
  email          VARCHAR(100) NOT NULL UNIQUE,
  phone          VARCHAR(15)  NOT NULL,
  license_no     VARCHAR(30)  NOT NULL UNIQUE,
  license_expiry DATE NOT NULL
);

CREATE TABLE bookings (
  booking_id   SERIAL PRIMARY KEY,
  customer_id  INT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  vehicle_id   INT NOT NULL REFERENCES vehicles(vehicle_id)   ON DELETE RESTRICT,
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  returned_on  DATE,
  status       VARCHAR(10) NOT NULL DEFAULT 'Reserved'
               CHECK (status IN ('Reserved','Active','Completed','Cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  created_by   INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  CHECK (end_date > start_date),
  EXCLUDE USING gist (
    vehicle_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  ) WHERE (status IN ('Reserved','Active'))
);
CREATE INDEX idx_bookings_vehicle_start ON bookings(vehicle_id, start_date);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE TABLE payments (
  payment_id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE RESTRICT,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  method     VARCHAR(10) NOT NULL CHECK (method IN ('Cash','Card','UPI')),
  paid_on    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE maintenance (
  maintenance_id SERIAL PRIMARY KEY,
  vehicle_id     INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  description    TEXT NOT NULL,
  cost           NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  opened_on      DATE NOT NULL DEFAULT CURRENT_DATE,
  closed_on      DATE,
  CHECK (closed_on IS NULL OR closed_on >= opened_on)
);
CREATE INDEX idx_maintenance_vehicle ON maintenance(vehicle_id);

CREATE TABLE fuel_logs (
  fuel_id    SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE RESTRICT,
  litres     NUMERIC(6,2) NOT NULL CHECK (litres > 0),
  cost       NUMERIC(8,2) NOT NULL CHECK (cost > 0),
  logged_on  DATE NOT NULL DEFAULT CURRENT_DATE
);
```
No table or column may be added, renamed or removed without Person A updating this file first and all three members agreeing.

### Database rules (exact behavior; error text is the exact `RAISE EXCEPTION` message — the API passes it to the UI unchanged)
| # | Rule | Where | Exact error message |
|---|---|---|---|
| R1 | No two bookings with status `Reserved`/`Active` may overlap for one vehicle | `EXCLUDE` constraint (23P01) | API maps to: `Vehicle is already booked for these dates` |
| R2 | New booking: vehicle status must not be `In Shop` or `Retired` (status `Rented` is allowed for future dates; overlap is blocked by R1) | `trg_booking_validate` BEFORE INSERT | `Vehicle is not available for booking` |
| R3 | New booking: customer `license_expiry` must be ≥ `end_date` | `trg_booking_validate` BEFORE INSERT | `Customer licence expires before return date` |
| R4 | New booking: `start_date` ≥ `CURRENT_DATE` | `trg_booking_validate` BEFORE INSERT | `Start date cannot be in the past` |
| R5 | `total_amount` on insert = `fn_booking_total(vehicle_id, start_date, end_date)`, client value ignored | `trg_booking_validate` BEFORE INSERT | — |
| R6 | Allowed status transitions only: Reserved→Active, Reserved→Cancelled, Active→Completed | `trg_booking_transition` BEFORE UPDATE OF status | `Invalid booking status transition` |
| R7 | Reserved→Active requires vehicle status `Available` | `trg_booking_transition` | `Vehicle is not available for booking` |
| R8 | On Active: vehicle → `Rented`. On Completed: set `returned_on = CURRENT_DATE` and vehicle → `In Shop` if an open maintenance row exists, else `Available`. On Cancelled: no vehicle change | `trg_booking_sync` AFTER UPDATE OF status | — |
| R9 | Sum of payments for a booking must not exceed `total_amount` | `trg_payment_check` BEFORE INSERT | `Payment exceeds outstanding balance` |
| R10 | No payment on a `Cancelled` booking | `trg_payment_check` BEFORE INSERT | `Cannot pay a cancelled booking` |
| R11 | Opening maintenance on a `Rented` or `Retired` vehicle is rejected | `trg_maintenance_open` BEFORE INSERT | `Cannot open maintenance on a rented or retired vehicle` |
| R12 | Open maintenance (`closed_on IS NULL`) on an `Available` vehicle → vehicle becomes `In Shop` | `trg_maintenance_sync` AFTER INSERT | — |
| R13 | Closing maintenance (closed_on set from NULL) → if no other open maintenance for that vehicle and vehicle is `In Shop`, vehicle becomes `Available` | `trg_maintenance_sync` AFTER UPDATE | — |
| R14 | An already-closed maintenance row cannot be updated | `trg_maintenance_open` BEFORE UPDATE | `Maintenance record is already closed` |
| R15 | A vehicle cannot be set to `Retired` while it has `Reserved`/`Active` bookings or an open maintenance row | `trg_vehicle_retire_guard` BEFORE UPDATE OF status | `Vehicle has open bookings or maintenance` |

### Database functions & views (frozen names and columns)
- `fn_booking_total(p_vehicle_id INT, p_start DATE, p_end DATE) RETURNS NUMERIC(10,2)` → `(p_end - p_start) * daily_rate` of the vehicle's category.
- `v_available_vehicles` → `vehicle_id, plate_no, make, model, category_name, daily_rate`
- `v_vehicle_profit` → `vehicle_id, plate_no, revenue, maintenance_cost, fuel_cost, profit` (revenue = sum of payments on that vehicle's bookings; all values `NUMERIC`, 0 when none)
- `v_monthly_revenue` → `month` (text `YYYY-MM`), `revenue`
- `v_overdue_returns` → `booking_id, plate_no, customer_name, phone, end_date, days_overdue` (status `Active` and `end_date < CURRENT_DATE`)

### API conventions (all endpoints)
- Success: HTTP 200/201 → `{ "ok": true, "data": <object|array> }`
- Failure: `{ "ok": false, "error": { "message": "<text>" } }`
- Status codes: 400 invalid input or CHECK violation (23514, 23502); 401 not logged in; 403 role not allowed; 404 not found; 409 conflict (23505 unique → `Duplicate value: <constraint name>`, 23503 FK → `Record is in use or does not exist`, 23P01 → R1 message, `P0001` trigger errors → message unchanged); 500 anything else → `Something went wrong`.
- All dates in JSON are `YYYY-MM-DD` strings. Money is a JSON number.
- All endpoints except `POST /api/auth/login` require a valid `session` cookie.
- The mapping from DB error code to HTTP response is implemented ONCE in `src/lib/api.js` (`handle(fn)` wrapper). Route handlers must use it.

### API endpoints
| Method | Path | Body / query | Response `data` | Roles | Owner |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | `{email, password}` | `{user_id, full_name, role}` + sets cookie | public | A |
| POST | `/api/auth/logout` | — | `{}` | any | A |
| GET | `/api/auth/me` | — | `{user_id, full_name, role}` | any | A |
| GET / POST | `/api/users` | POST: `{full_name, email, password, role}` | rows: `user_id, full_name, email, role` | admin | A |
| GET / POST | `/api/categories` | POST: `{name, daily_rate}` | rows of table | GET any, POST admin | A |
| PUT | `/api/categories/[id]` | `{name, daily_rate}` | row | admin | A |
| GET | `/api/vehicles` | query `status`, `category_id` optional | rows: all vehicle columns + `category_name`, `daily_rate` | any | A |
| POST | `/api/vehicles` | `{plate_no, make, model, year, category_id, odometer_km}` (status always `Available`) | row | any | A |
| GET / PUT | `/api/vehicles/[id]` | PUT: `{make, model, year, category_id, odometer_km}` | GET: `{vehicle, bookings, maintenance}` (vehicle = vehicle row + `category_name`, `daily_rate`); PUT: row | any | A |
| PATCH | `/api/vehicles/[id]/retire` | — | row | admin | A |
| GET / POST | `/api/customers` | POST: `{full_name, email, phone, license_no, license_expiry}`; GET query `q` (matches name/phone/licence with `ILIKE`) | rows | any | A |
| GET / PUT | `/api/customers/[id]` | PUT: same fields as POST | row | any | A |
| GET | `/api/bookings` | query `status` optional | rows: booking columns + `customer_name`, `plate_no` | any | B |
| POST | `/api/bookings` | `{customer_id, vehicle_id, start_date, end_date}` | row (with computed `total_amount`) | any | B |
| GET | `/api/bookings/[id]` | — | booking + `customer_name`, `plate_no`, `paid` (sum payments), `balance`, `payments` (array) | any | B |
| PATCH | `/api/bookings/[id]/status` | `{status}` (`Active`, `Cancelled` or `Completed`) | row | any | B |
| GET / POST | `/api/payments` | POST: `{booking_id, amount, method}`; GET query `booking_id` optional | rows: payment columns + `booking_id`, `customer_name` | any | B |
| GET / POST | `/api/maintenance` | POST: `{vehicle_id, description, cost}` | rows: maintenance columns + `plate_no` | any | C |
| PATCH | `/api/maintenance/[id]/close` | `{cost}` optional | row | any | C |
| GET / POST | `/api/fuel` | POST: `{vehicle_id, litres, cost, logged_on}` | rows + `plate_no` | any | C |
| GET | `/api/reports/dashboard` | — | `{vehicles_total, available, rented, in_shop, active_bookings, overdue_returns}` | any | C |
| GET | `/api/reports/vehicle-profit` | — | rows of `v_vehicle_profit` | any | C |
| GET | `/api/reports/monthly-revenue` | — | rows of `v_monthly_revenue` | any | C |
| GET | `/api/reports/overdue-returns` | — | rows of `v_overdue_returns` | any | C |

### Environment variables (`.env.local`, never committed; `.env.example` committed by Person A)
| Name | Value (example) | Purpose | Set by |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/rental_fleet` | `pg` Pool connection | each member locally |
| `SESSION_SECRET` | any string of 32+ characters (same for all members is NOT required) | JWT signing | each member locally |

### Seed login (created by `db/seed_a.sql`)
`admin@rental.local` / `Admin@123` (role admin); `staff@rental.local` / `Staff@123` (role staff). Hash with `crypt('<password>', gen_salt('bf'))` (bcryptjs verifies this format).

### File Structure (root: `rental-fleet/`)
```
rental-fleet/
├── BUILD.md  BUILD_A_fleet.md  BUILD_B_bookings.md  BUILD_C_reports.md  INTEGRATION.md  DESIGN.md
├── .env.example
├── package.json  next.config.js  middleware.js
├── db/
│   ├── schema.sql              (A)
│   ├── triggers_vehicle.sql    (A)
│   ├── triggers_booking.sql    (B)   -- includes fn_booking_total
│   ├── triggers_maintenance.sql(C)
│   ├── views.sql               (C)
│   ├── seed_a.sql  seed_b.sql  seed_c.sql
│   ├── queries_a.sql  queries_b.sql  queries_c.sql
│   ├── reset.sh                (A)   -- drops & recreates DB, runs all files in INTEGRATION.md order
│   └── tests.sql               (A)   -- 21 automated scenario checks, rolled back after running
├── docs/
│   ├── er-diagram.*            (A)
│   ├── normalization.md        (B)
│   └── report.md               (C)
└── src/
    ├── lib/  db.js  auth.js  api.js  format.js         (A)
    ├── components/  Sidebar.js PageHeader.js DataTable.js StatusBadge.js FormField.js Alert.js  (A)
    └── app/
        ├── globals.css  layout.js  page.js             (A)  -- page.js redirects to /dashboard
        ├── login/page.js                               (A)
        ├── (app)/layout.js                             (A)  -- app-shell + Sidebar
        ├── (app)/dashboard/page.js                     (C)
        ├── (app)/vehicles/ page.js new/page.js [id]/page.js     (A)
        ├── (app)/customers/ page.js new/page.js [id]/page.js    (A)
        ├── (app)/categories/page.js  (app)/users/page.js        (A)
        ├── (app)/bookings/ page.js new/page.js [id]/page.js     (B)
        ├── (app)/payments/page.js                               (B)
        ├── (app)/maintenance/ page.js new/page.js               (C)
        ├── (app)/fuel/ page.js new/page.js                      (C)
        ├── (app)/reports/page.js                                (C)
        └── api/ (folders exactly as in the endpoint table; owner = owner column)
```

## Team Overview
| Teammate | Role | Owns | Integrates With |
|---|---|---|---|
| Person A | Fleet, Customers & Access | schema, auth, layout, shared components, users, categories, vehicles, customers, ER diagram | B and C consume `vehicles`, `customers`, `lib/*`, `components/*` |
| Person B | Bookings & Payments | booking/payment triggers, `fn_booking_total`, bookings and payments pages + APIs, normalization doc | reads A's tables; its triggers update `vehicles.status`; reads C's `maintenance` table (R8) |
| Person C | Maintenance, Fuel & Reports | maintenance/fuel pages + APIs, maintenance triggers, all views, dashboard, reports, project report | reads A/B tables; its triggers update `vehicles.status` |

## Demo / Viva Path (must work)
1. Login as admin → dashboard shows counts.
2. Add a vehicle and a customer.
3. Create booking (amount auto-calculated) → vehicle still Available (Reserved).
4. Try a second booking for overlapping dates → rejected with R1 message.
5. Activate booking → vehicle becomes Rented. Record a payment; try overpaying → R9 message.
6. Complete booking → vehicle becomes Available.
7. Open maintenance → vehicle becomes In Shop; try booking it → R2 message. Close maintenance → Available.
8. Show Reports page (profit per vehicle, monthly revenue, overdue returns).

## DO NOT Section (applies to all agents)
- Do not add any feature, table, column, endpoint or page not listed in this document
- Do not change shared contract definitions (schema, rules, API shapes, design tokens)
- Do not rename files or folders
- Do not install packages not in the allowed list
- Do not use your own judgment to "improve" the code
- Do not enforce a business rule in JavaScript that is listed as a database rule
- Do not use `SELECT *`; list the columns
- Do not concatenate user input into SQL; use `$1, $2, ...` parameters
- Do not use an ORM or query builder
- Do not delete rows from any table (no DELETE endpoints exist); retiring a vehicle is the only "removal"
