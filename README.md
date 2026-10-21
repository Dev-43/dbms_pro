# Vehicle Rental & Fleet Management System

DBMS mini project (3-person team). Staff-only web app where **PostgreSQL enforces the business rules** (constraints, triggers, functions, views) and Next.js only runs SQL and shows the results.

## Stack
PostgreSQL 15+ (local) · Next.js 14 App Router (JavaScript) · `pg` with raw SQL (no ORM) · plain CSS · `bcryptjs` + `jose` for login

## Read these first (in this order)
1. `BUILD.md` — master spec: schema, database rules R1–R15, API endpoints, file tree, demo path
2. `DESIGN.md` — frontend rules: colours, classes, components, page templates
3. Your own file: `BUILD_A_fleet.md`, `BUILD_B_bookings.md` or `BUILD_C_reports.md`
4. `INTEGRATION.md` — merge order, ownership, scenario tests

## Team split
| Person | Role |
|---|---|
| A | Fleet, Customers & Access (schema, auth, shared components, vehicles, customers, users, categories) |
| B | Bookings & Payments (booking/payment triggers and pages) |
| C | Maintenance, Fuel & Reports (maintenance triggers, views, dashboard, reports) |

Person A finishes the foundation and tags `v0-foundation` first; B and C start after that.

## UI preview
Open `ui-kit/demo.html` in a browser (clickable demo with mock data) or the single pages in `ui-kit/` (`login.html`, `dashboard.html`, `vehicles.html`, `bookings.html`, `form.html`). `ui-kit/styles.css` is identical to `src/app/globals.css`.

## Database (ready now)
The full database layer is in `db/` and already tested. Requires PostgreSQL 15+ and a user `postgres` / password `postgres` on localhost (or set `PG_URL`).
```bash
bash db/reset.sh
```

## Setup (after the Next.js foundation exists)
```bash
cp .env.example .env.local     # then edit DATABASE_URL and SESSION_SECRET
npm install
bash db/reset.sh               # recreates the rental_fleet database and loads all SQL
npm run dev
```
Run the database checks (all lines must print `PASS`):
```bash
psql postgresql://postgres:postgres@localhost:5432/rental_fleet -v ON_ERROR_STOP=1 -f db/tests.sql
```
Seed login: `admin@rental.local` / `Admin@123` and `staff@rental.local` / `Staff@123`.

## Git rules
Branches: `a/<task>`, `b/<task>`, `c/<task>`. Merge to `main` only through pull requests. Commit format: `A: add vehicle list page`.
