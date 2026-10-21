# INTEGRATION.md — Merge Rules & Interface Contracts

> This document defines how the pieces come together. Read this before merging any branch.

## Integration Order
1. **A: foundation** — `schema.sql`, `reset.sh`, `seed_a.sql`, `src/lib/*`, `src/components/*`, `globals.css`, layout, login, auth. Merge to `main` and tag `v0-foundation`. *Reason: B and C both depend on the tables, the DB helper, the API wrapper and the shared components.*
2. **B and C in parallel** (branches `b/*`, `c/*`) after the tag. They touch different tables' triggers and different pages, so they do not conflict.
3. **A: vehicles, customers, categories, users** (can run in parallel with step 2 — B and C use the seed data until A's pages exist).
4. **Trigger integration check** — merge B's `triggers_booking.sql` and C's `triggers_maintenance.sql` together and run the Scenario Tests below. *Reason: both sets of triggers write `vehicles.status`; the interaction (R8 + R12/R13) is the only place they can conflict.*
5. **Seeds merged last** — run `reset.sh` end to end.
6. **Docs and viva rehearsal.**

### SQL execution order (used by `db/reset.sh`)
`schema.sql`, `triggers_vehicle.sql`, `triggers_booking.sql`, `triggers_maintenance.sql`, `views.sql`, `seed_a.sql`, `seed_b.sql`, `seed_c.sql` (exactly this order).

## Interface Contracts
| From → To | Interface | Exact contract |
|---|---|---|
| A → B, C | DB tables | `schema.sql` in BUILD.md; changes need all 3 members' agreement |
| A → B, C | `src/lib/db.js` | `import { query } from '@/lib/db'`; `query(text, params)` returns `{ rows }` |
| A → B, C | `src/lib/api.js` | `handle(async (request, ctx) => { ... return ok(data, status) })`; throws are mapped per BUILD.md |
| A → B, C | `src/lib/auth.js` | `await requireRole(request, ['admin','staff'])` returns the session `{user_id, full_name, role}` |
| A → B, C | components | Props exactly as DESIGN.md §7 |
| B → C | booking data | C's views read `bookings`, `payments` columns exactly as in `schema.sql` |
| C → B | open maintenance | B's trigger R8 reads `maintenance(vehicle_id, closed_on)` |
| B ↔ C | `vehicles.status` | B sets `Rented`/`Available`/`In Shop` (R8); C sets `In Shop`/`Available` (R12/R13); A sets `Retired` only. Nobody else writes this column. |
| B, C → A | detail page | `GET /api/vehicles/[id]` (A) reads `bookings` and `maintenance` tables directly with the column lists in BUILD_A Task 4 |

## Merge Rules
- **Branch naming:** `a/<task>`, `b/<task>`, `c/<task>` (example: `b/booking-triggers`). `main` is protected: merge only via pull request.
- **Who merges what:** each person merges their own branch after one other member has reviewed it. A merges `a/foundation` first. Conflicts in a file you do not own are resolved by the file's owner.
- **Commit message format:** `<A|B|C>: <what>` (example: `B: add payment overpay trigger`).
- **Before merging, every person runs:** `bash db/reset.sh` with no errors; `npm run build` with no errors; the Scenario Tests for their own rules; opens each of their pages once while logged in.

## What Each Agent Must NOT Touch
| File/Module | Owner | Others must not modify |
|---|---|---|
| `db/schema.sql`, `db/triggers_vehicle.sql`, `db/reset.sh` | A | B, C |
| `src/lib/*`, `src/components/*`, `src/app/globals.css`, root and `(app)` layouts, `middleware.js`, `package.json` | A | B, C |
| `db/triggers_booking.sql`, bookings/payments pages and APIs | B | A, C |
| `db/triggers_maintenance.sql`, `db/views.sql`, maintenance/fuel/dashboard/reports pages and APIs | C | A, B |
| `BUILD*.md`, `INTEGRATION.md`, `DESIGN.md` | A edits only after all 3 agree | everyone else |

## Scenario Tests (run in `psql` after `reset.sh`; each must give the stated result)
| # | Action | Expected |
|---|---|---|
| S1 | Insert a booking for a vehicle with status `In Shop` | Error `Vehicle is not available for booking` |
| S2 | Insert two bookings, same vehicle, overlapping dates | Second fails (R1, code 23P01) |
| S3 | Insert booking, customer licence expired before `end_date` | Error `Customer licence expires before return date` |
| S4 | Insert booking, then update status Reserved→Active | Vehicle status `Rented` |
| S5 | Update Active→Completed | Vehicle `Available`, `returned_on` = today |
| S6 | Update Completed→Active | Error `Invalid booking status transition` |
| S7 | Pay more than `total_amount` | Error `Payment exceeds outstanding balance` |
| S8 | Open maintenance on Available vehicle | Vehicle `In Shop` |
| S9 | Open maintenance on a `Rented` vehicle | Error `Cannot open maintenance on a rented or retired vehicle` |
| S10 | Close the only open maintenance | Vehicle `Available` |
| S11 | Set vehicle `Retired` while it has a Reserved booking | Error `Vehicle has open bookings or maintenance` |
| S12 | `SELECT SUM(revenue) FROM v_vehicle_profit` vs `SELECT SUM(amount) FROM payments` | Equal |
| S13 | Two open maintenance rows on one vehicle, close one | Vehicle stays `In Shop`; closing the second → `Available` |
| S14 | Seed booking 5 (Active, end date in the past) | Appears in `v_overdue_returns` |

All of these (plus R4, R5, R7, R9, R10, R14) are automated in `db/tests.sql`. Run: `psql "$PG_URL/rental_fleet" -v ON_ERROR_STOP=1 -f db/tests.sql` — every line must print `PASS`.

## Demo Path (step by step) — which code runs it
| Step | Action | Code that runs |
|---|---|---|
| 1 | Login, dashboard | A (auth), C (dashboard) |
| 2 | Add vehicle, add customer | A |
| 3 | Create booking | B (`trg_booking_validate`, `fn_booking_total`) |
| 4 | Overlapping booking rejected | A's `EXCLUDE` constraint, error mapped by A's `api.js` |
| 5 | Activate, pay, overpay rejected | B (`trg_booking_transition`, `trg_booking_sync`, `trg_payment_check`) |
| 6 | Complete booking | B |
| 7 | Open and close maintenance; booking on In Shop vehicle rejected | C (`trg_maintenance_*`), B (R2) |
| 8 | Reports | C (views) |

## Known Integration Risks
| Risk | Mitigation |
|---|---|
| B or C starts before the foundation exists | Hard rule: no work on pages/APIs until `v0-foundation` is tagged; they may write their `.sql` files against BUILD.md meanwhile |
| Both trigger sets update `vehicles.status` inconsistently | Ownership table above + Scenario tests S4, S5, S8, S9, S10 run before the final merge |
| Schema changes mid-way break everyone | Schema frozen; changes only through BUILD.md edit agreed by all 3 |
| Seeds fail because of trigger rules (past start dates in R4) | `seed_b.sql` runs `ALTER TABLE bookings DISABLE TRIGGER trg_booking_validate;` before inserting its bookings and `ALTER TABLE bookings ENABLE TRIGGER trg_booking_validate;` after. Because that trigger also computes `total_amount`, seed inserts must supply `total_amount` using `fn_booking_total(vehicle_id, start_date, end_date)`. All status updates in the seed run with the other triggers enabled. |
| Different DB error text shown in UI | All messages are defined once in BUILD.md; API passes them through unchanged |
| Late UI inconsistencies | Everyone uses only `DESIGN.md` components and classes |
