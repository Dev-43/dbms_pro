# BUILD_A_fleet.md — Person A: Fleet, Customers & Access
> ⚠️ AGENT INSTRUCTIONS: You are building ONLY the items in this file. Nothing else. Build exactly as specified. Read `BUILD.md` (contracts) and `DESIGN.md` (frontend rules) first.


## Status
Already done and tested in `db/`: `schema.sql`, `triggers_vehicle.sql` (Task 6), `seed_a.sql`, `queries_a.sql` (Task 8), `reset.sh`, `tests.sql`. Task 1 therefore only needs the Next.js skeleton, `src/lib/*`, `src/components/*`, layouts and login (the SQL part is just verifying `bash db/reset.sh` runs). The ER diagram (Task 7) is still open.

## Your Scope
- Project setup (`package.json`, `next.config.js`, `.env.example`, `middleware.js`)
- `db/schema.sql` (exactly the schema in BUILD.md), `db/triggers_vehicle.sql`, `db/seed_a.sql`, `db/queries_a.sql`, `db/reset.sh`
- Shared code: `src/lib/*`, `src/components/*`, `src/app/globals.css`, root layout, login
- Users, categories, vehicles, customers (pages + APIs)
- `docs/er-diagram.*`

## Your Files
| File | Purpose |
|---|---|
| `package.json` | Only the allowed packages from BUILD.md; scripts: `dev`, `build`, `start` |
| `.env.example` | `DATABASE_URL`, `SESSION_SECRET` placeholders |
| `middleware.js` | Redirect to `/login` when cookie `session` is missing/invalid on every page route except `/login`; API routes are checked by `requireRole` instead |
| `db/schema.sql` | Copy of the schema in BUILD.md, unchanged |
| `db/triggers_vehicle.sql` | `trg_vehicle_retire_guard` (rule R15) |
| `db/seed_a.sql` | 2 users (seed login in BUILD.md), 4 categories (Hatchback ₹1500, Sedan ₹2200, SUV ₹3200, Luxury ₹5500), 10 vehicles, 8 customers (at least 1 with licence expiring within 30 days from seed date, 1 already expired) |
| `db/queries_a.sql` | 5 showcase queries (see Task 8) |
| `db/reset.sh` | Drops and recreates database `rental_fleet`, then runs the files in the order given in INTEGRATION.md |
| `src/lib/db.js` | Exports one `pg.Pool` built from `DATABASE_URL` and `query(text, params)` |
| `src/lib/auth.js` | `signSession(payload)`, `getSession(request)`, `requireRole(request, roles)` (throws error with `status` 401/403) |
| `src/lib/api.js` | `handle(fn)` wrapper + DB-error mapping exactly as in BUILD.md "API conventions"; `ok(data, status=200)` helper |
| `src/lib/format.js` | `formatDate`, `formatMoney` as defined in DESIGN.md §7 |
| `src/components/*.js` | The 6 components defined in DESIGN.md §7 |
| `src/app/globals.css` | Verbatim copy of the CSS in DESIGN.md appendix |
| `src/app/layout.js`, `page.js`, `login/page.js`, `(app)/layout.js` | Root layout (imports globals.css), redirect to `/dashboard`, login page (DESIGN.md §8.5), app shell (`app-shell` + `Sidebar` + `main`) |
| `src/app/(app)/vehicles/**`, `customers/**`, `categories/page.js`, `users/page.js` | Pages |
| `src/app/api/auth/**`, `users`, `categories`, `vehicles`, `customers` | API routes per BUILD.md endpoint table |

## Your Tasks (ordered by priority)

### Task 1: Foundation (BLOCKS B and C — finish first)
- What to build: Next.js project skeleton, `db/schema.sql`, `db/reset.sh`, `db/seed_a.sql`, `src/lib/*`, `src/components/*`, `globals.css`, `(app)/layout.js`.
- Inputs: BUILD.md, DESIGN.md.
- Outputs: push to branch `a/foundation`, merge to `main`, tag `v0-foundation`. B and C start only after this tag.
- Acceptance criteria: `bash db/reset.sh` completes with no errors; `npm run dev` starts; opening `/login` shows the styled login card; logging in as `admin@rental.local` reaches `/dashboard` (a page owned by C; until C merges, a temporary file `(app)/dashboard/page.js` containing only `<PageHeader title="Dashboard" />` is committed by A and then overwritten by C).

### Task 2: Auth
- What to build: `POST /api/auth/login` (query `users` by email with `SELECT user_id, full_name, role, password_hash`; verify with `bcryptjs.compare`; on failure return 401 `{"ok":false,"error":{"message":"Invalid email or password"}}`; on success set cookie `session` = JWT `{user_id, full_name, role}`, `httpOnly`, `sameSite=lax`, `path=/`, 8h), `POST /api/auth/logout` (clears cookie), `GET /api/auth/me`.
- Acceptance criteria: wrong password → 401 with the exact message; any other API without cookie → 401 `Not logged in`; staff calling an admin endpoint → 403 `Admin access required`.

### Task 3: Categories & Users
- What to build: endpoints and pages per BUILD.md. `/categories` is one page: a `card` at the top with a `form-grid` of two `FormField`s (name, daily_rate) and a Save button, and a `DataTable` below it with an "Edit" link per row that fills the form (client state). `/users` is built the same way (fields: full_name, email, password, role select admin/staff; no edit, create only). Both pages are admin-only; a staff user opening the URL is redirected to `/dashboard`.
- Acceptance criteria: duplicate category name shows `Duplicate value: vehicle_categories_name_key`; daily_rate 0 shows the CHECK error as 400 with message `Invalid input`.

### Task 4: Vehicles
- What to build: list (columns: Plate, Make, Model, Year, Category, Rate/day (numeric, `formatMoney`), Odometer (numeric), Status (`StatusBadge`), Actions "View"), filters by status and category (using `FormField` select) that re-fetch with query params; create page; detail/edit page (edit fields make, model, year, category, odometer; plate and status are read-only) with an admin-only "Retire Vehicle" `btn btn-danger` that calls the retire endpoint and shows the trigger's R15 message on failure. Detail page shows two related tables (bookings of this vehicle, maintenance of this vehicle) using the `bookings` and `maintenance` arrays returned by `GET /api/vehicles/[id]`; Person A writes those two extra SELECTs (columns: bookings → `booking_id, customer_name, start_date, end_date, status, total_amount`; maintenance → `maintenance_id, description, cost, opened_on, closed_on`).
- Acceptance criteria: duplicate plate → `Duplicate value: vehicles_plate_no_key`; retiring a vehicle with a Reserved booking shows `Vehicle has open bookings or maintenance`.

### Task 5: Customers
- What to build: list with search box (`q`), create, edit pages. Highlight expired licences: in the list, the Licence Expiry cell uses `badge badge-danger` when `license_expiry < today`, `badge badge-warning` when within 30 days, plain date otherwise.
- Acceptance criteria: duplicate email/licence → 409 `Duplicate value: <constraint>`; search `q=ravi` returns only matching rows.

### Task 6: Vehicle retire trigger
- What to build: `db/triggers_vehicle.sql` implementing R15 with function `fn_vehicle_retire_guard()` and trigger `trg_vehicle_retire_guard` BEFORE UPDATE OF status ON vehicles, firing only when `NEW.status = 'Retired'`.
- Acceptance criteria: the rule R15 scenarios in INTEGRATION.md "Scenario tests" pass.

### Task 7: ER diagram
- What to build: `docs/er-diagram.*` (any format you can export; PNG or PDF) showing all 8 tables, PKs, FKs and cardinalities exactly as in `schema.sql`.

### Task 8: Showcase queries (`db/queries_a.sql`)
Write exactly 5 queries, each preceded by a comment line `-- Q<n>: <purpose>`: (1) vehicles with category name via INNER JOIN; (2) vehicles that have never been booked via LEFT JOIN … IS NULL; (3) count of vehicles per status per category with GROUP BY; (4) categories having more than 2 vehicles using HAVING; (5) customers whose licence expires in the next 30 days using a date expression.

## Contracts You Must Honor
Whole `BUILD.md` and `DESIGN.md`. You are the only person allowed to change files in `src/lib/`, `src/components/`, `globals.css`, `db/schema.sql`.

## DO NOT
- Do not build anything outside your scope list
- Do not modify files owned by other teammates
- Do not change the shared contract definitions
- Do not add packages without updating the master BUILD.md first
- Do not add DELETE endpoints
- Do not store plaintext passwords; never return `password_hash` from any endpoint
