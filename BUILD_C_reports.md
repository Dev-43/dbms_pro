# BUILD_C_reports.md — Person C: Maintenance, Fuel & Reports
> ⚠️ AGENT INSTRUCTIONS: You are building ONLY the items in this file. Nothing else. Build exactly as specified. Read `BUILD.md` (contracts) and `DESIGN.md` (frontend rules) first. Start only after Person A has tagged `v0-foundation`.


## Status
Already done and tested in `db/`: `triggers_maintenance.sql` (Task 1), `views.sql` (Task 2), `seed_c.sql`, `queries_c.sql` (Task 7). Still open: Tasks 3, 4, 5, 6 (APIs and pages) and Task 8 (`docs/report.md`).

## Your Scope
- Maintenance rules in SQL (R11–R14) and all database views
- Maintenance and fuel pages + APIs
- Dashboard and reports pages + APIs
- `db/seed_c.sql`, `db/queries_c.sql`, `docs/report.md`

## Your Files
| File | Purpose |
|---|---|
| `db/triggers_maintenance.sql` | `trg_maintenance_open` (BEFORE INSERT and BEFORE UPDATE), `trg_maintenance_sync` (AFTER INSERT and AFTER UPDATE) |
| `db/views.sql` | The four views defined in BUILD.md |
| `db/seed_c.sql` | 5 maintenance rows (3 closed, 1 open on a vehicle that is not in any Reserved/Active booking, 1 closed with high cost), 15 fuel logs spread over at least 3 vehicles and 3 different months. Insert the open maintenance row via normal INSERT so the trigger sets the vehicle to `In Shop`. |
| `db/queries_c.sql` | 5 showcase queries (Task 7) |
| `src/app/api/maintenance/route.js`, `maintenance/[id]/close/route.js` | Maintenance APIs |
| `src/app/api/fuel/route.js` | Fuel API |
| `src/app/api/reports/dashboard/route.js`, `vehicle-profit/route.js`, `monthly-revenue/route.js`, `overdue-returns/route.js` | Report APIs |
| `src/app/(app)/maintenance/page.js`, `new/page.js` | Maintenance pages |
| `src/app/(app)/fuel/page.js`, `new/page.js` | Fuel pages |
| `src/app/(app)/dashboard/page.js` | Dashboard (overwrites A's placeholder) |
| `src/app/(app)/reports/page.js` | Reports page |
| `docs/report.md` | Project report |

## Your Tasks (ordered by priority)

### Task 1: Maintenance triggers
- What to build: `db/triggers_maintenance.sql` implementing R11, R12, R13, R14 using the exact messages in BUILD.md. `fn_maintenance_open()` handles R11 (INSERT) and R14 (UPDATE, when `OLD.closed_on IS NOT NULL`). `fn_maintenance_sync()` handles R12 (AFTER INSERT) and R13 (AFTER UPDATE when `OLD.closed_on IS NULL AND NEW.closed_on IS NOT NULL`). Never set vehicle status to anything other than `In Shop` or `Available` in these triggers.
- Acceptance criteria: opening maintenance on a Rented vehicle → `Cannot open maintenance on a rented or retired vehicle`; opening on Available → vehicle `In Shop`; closing the only open record → vehicle `Available`; two open records on one vehicle, closing one → vehicle stays `In Shop`.

### Task 2: Views
- What to build: `db/views.sql` with exactly the four views and column lists from BUILD.md. `v_vehicle_profit.revenue` = `COALESCE(SUM(payments.amount),0)` per vehicle through bookings; `maintenance_cost` = `COALESCE(SUM(maintenance.cost),0)`; `fuel_cost` = `COALESCE(SUM(fuel_logs.cost),0)`; `profit = revenue − maintenance_cost − fuel_cost`. Aggregate each source in its own subquery before joining to avoid row multiplication. `v_monthly_revenue.month` = `to_char(paid_on, 'YYYY-MM')`, ordered ascending.
- Acceptance criteria: `SELECT SUM(revenue) FROM v_vehicle_profit` equals `SELECT SUM(amount) FROM payments`.

### Task 3: Maintenance APIs and pages
- What to build: endpoints per BUILD.md (`PATCH /api/maintenance/[id]/close` runs `UPDATE maintenance SET closed_on = CURRENT_DATE, cost = COALESCE($1, cost) WHERE maintenance_id = $2`). `/maintenance` list (DESIGN.md §8.1): columns ID, Vehicle (plate), Description, Cost (numeric), Opened (`formatDate`), Closed (`formatDate` or empty), Status (`StatusBadge` with value "Open" or "Closed"), Actions: "Close" button (`btn`) shown only on open rows. `/maintenance/new` (DESIGN.md §8.2): Vehicle select (status `Available` or `In Shop` only), Description (textarea), Estimated cost.
- Acceptance criteria: demo path step 7 works using these pages.

### Task 4: Fuel APIs and pages
- What to build: `/fuel` list (DESIGN.md §8.1; columns ID, Vehicle, Litres (numeric), Cost (numeric), Logged On) with vehicle filter; `/fuel/new` form (Vehicle select, Litres, Cost, Date default today). 
- Acceptance criteria: litres 0 → 400 `Invalid input`.

### Task 5: Report APIs
- What to build: the four `/api/reports/*` endpoints. Each is one SELECT from a view; `dashboard` is a single SELECT using `COUNT(*) FILTER (WHERE ...)` on `vehicles` plus two scalar subqueries (active bookings, overdue returns count from `v_overdue_returns`).
- Acceptance criteria: response shapes exactly as in BUILD.md.

### Task 6: Dashboard and Reports pages
- What to build: `/dashboard` per DESIGN.md §8.4: six `stat` tiles (Total Vehicles, Available, Rented, In Shop, Active Bookings, Overdue Returns) and one `card` "Overdue Returns" with a `DataTable` (Booking #, Vehicle, Customer, Phone, Due Date, Days Overdue). `/reports`: three cards, each an `<h2>` + `DataTable`: "Profit per Vehicle" (Plate, Revenue, Maintenance, Fuel, Profit — all numeric, `formatMoney`; Profit cell uses `badge-success` if ≥ 0 else `badge-danger`), "Monthly Revenue" (Month, Revenue), "Overdue Returns" (same columns as dashboard). No charts.
- Acceptance criteria: numbers match the views.

### Task 7: Showcase queries (`db/queries_c.sql`)
Exactly 5 queries with `-- Q<n>:` comments: (1) top 3 vehicles by profit from `v_vehicle_profit`; (2) vehicles currently `In Shop` with their open maintenance description via JOIN; (3) monthly fuel cost per vehicle with GROUP BY + HAVING total > 0; (4) vehicles never sent to maintenance using `NOT EXISTS`; (5) running total of revenue by month using `SUM(revenue) OVER (ORDER BY month)`.

### Task 8: `docs/report.md` and viva script
Sections, in this order, 3–6 sentences each: Introduction, Problem Statement, Tech Stack (with the reason PostgreSQL was chosen: exclusion constraints, triggers, views), Schema Overview (refer to ER diagram), Database Rules (table of R1–R15 copied from BUILD.md), Views & Queries, Demo Walkthrough (the 8 steps in BUILD.md), Conclusion.

## Contracts You Must Honor
BUILD.md sections: schema, rules R11–R14, views, API conventions, endpoints owned by C, DESIGN.md in full.

## DO NOT
- Do not build anything outside your scope list
- Do not modify files owned by other teammates (including `src/lib/*`, `src/components/*`, `db/schema.sql`)
- Do not change the shared contract definitions
- Do not add packages without updating the master BUILD.md first
- Do not add charts, chart libraries or export features
- Do not calculate profit, revenue or counts in JavaScript; they come from SQL
