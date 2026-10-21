# BUILD_B_bookings.md — Person B: Bookings & Payments
> ⚠️ AGENT INSTRUCTIONS: You are building ONLY the items in this file. Nothing else. Build exactly as specified. Read `BUILD.md` (contracts) and `DESIGN.md` (frontend rules) first. Start only after Person A has tagged `v0-foundation`.


## Status
Already done and tested in `db/`: `triggers_booking.sql` (Tasks 1–3), `seed_b.sql`, `queries_b.sql` (Task 7). Still open: Tasks 4, 5, 6 (APIs and pages) and Task 8 (`docs/normalization.md`). Read the trigger file first so the UI shows the exact error messages.

## Your Scope
- Booking and payment business rules in SQL (R2–R10), `fn_booking_total`
- Bookings and payments pages + APIs
- `db/seed_b.sql`, `db/queries_b.sql`, `docs/normalization.md`

## Your Files
| File | Purpose |
|---|---|
| `db/triggers_booking.sql` | `fn_booking_total`, `trg_booking_validate`, `trg_booking_transition`, `trg_booking_sync`, `trg_payment_check` |
| `db/seed_b.sql` | 12 bookings covering every status (at least: 3 Completed in different months with payments, 2 Active — one with `end_date` before today so it appears in overdue, 2 Reserved in the future, 2 Cancelled), payments for them. Insert every row as `Reserved` (with `trg_booking_validate` disabled during the inserts and re-enabled after, `total_amount` supplied via `fn_booking_total`, as described in INTEGRATION.md risks), then update status so the other triggers run. |
| `db/queries_b.sql` | 5 showcase queries (Task 7) |
| `src/app/api/bookings/route.js`, `bookings/[id]/route.js`, `bookings/[id]/status/route.js` | Booking APIs |
| `src/app/api/payments/route.js` | Payment API |
| `src/app/(app)/bookings/page.js`, `new/page.js`, `[id]/page.js` | Booking pages |
| `src/app/(app)/payments/page.js` | Payments list page |
| `docs/normalization.md` | Normalization write-up |

## Your Tasks (ordered by priority)

### Task 1: `fn_booking_total` and `trg_booking_validate`
- What to build: in `db/triggers_booking.sql`, function `fn_booking_total(p_vehicle_id INT, p_start DATE, p_end DATE) RETURNS NUMERIC(10,2)` per BUILD.md. Trigger function `fn_booking_validate()` + trigger `trg_booking_validate` BEFORE INSERT ON bookings implementing R2, R3, R4, R5 in that order, using `RAISE EXCEPTION '<exact message>'` from BUILD.md. Also force `NEW.status := 'Reserved'` and `NEW.returned_on := NULL` on insert.
- Acceptance criteria: INSERT for an `In Shop` vehicle → `Vehicle is not available for booking`; customer with expired licence → `Customer licence expires before return date`; past start date → `Start date cannot be in the past`; inserted `total_amount` equals days × category rate regardless of the value supplied.

### Task 2: Status transitions
- What to build: `fn_booking_transition()` + `trg_booking_transition` BEFORE UPDATE OF status (R6, R7), and `fn_booking_sync()` + `trg_booking_sync` AFTER UPDATE OF status (R8). Fire only when `OLD.status IS DISTINCT FROM NEW.status`. R8 on Completed: `UPDATE bookings SET returned_on = CURRENT_DATE` is done in the BEFORE trigger by setting `NEW.returned_on := CURRENT_DATE`; the AFTER trigger sets the vehicle status by checking `EXISTS (SELECT 1 FROM maintenance WHERE vehicle_id = NEW.vehicle_id AND closed_on IS NULL)`.
- Acceptance criteria: Completed→Active rejected with `Invalid booking status transition`; Active booking sets vehicle `Rented`; Completed sets vehicle `Available` (or `In Shop` if open maintenance exists).

### Task 3: Payment trigger
- What to build: `fn_payment_check()` + `trg_payment_check` BEFORE INSERT ON payments (R9, R10). Outstanding balance = `bookings.total_amount − COALESCE(SUM(payments.amount),0)`.
- Acceptance criteria: paying more than the balance → `Payment exceeds outstanding balance`; paying a Cancelled booking → `Cannot pay a cancelled booking`.

### Task 4: Booking APIs
- What to build: exactly the endpoints in BUILD.md. `POST /api/bookings` inserts only `customer_id, vehicle_id, start_date, end_date, created_by` (`created_by` = session `user_id`) — never `total_amount` or `status`. `PATCH /api/bookings/[id]/status` runs `UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING <columns>`; accepts only `Active`, `Cancelled`, `Completed` (anything else → 400 `Invalid input`). `GET /api/bookings/[id]` returns booking + `customer_name`, `plate_no`, `paid`, `balance`, `payments` array. Use `handle()` from `src/lib/api.js`; do not catch DB errors yourself.
- Acceptance criteria: every error message in BUILD.md rules R1–R10 appears unchanged in the JSON response with the status code from the API conventions.

### Task 5: Booking pages
- What to build: 
  - `/bookings` list (DESIGN.md §8.1): columns Booking # , Customer, Vehicle (plate), Start, End, Amount (numeric), Status (`StatusBadge`), Actions "View". Filter: status select.
  - `/bookings/new` (DESIGN.md §8.2): fields Customer (select from `GET /api/customers`), Vehicle (select from `GET /api/vehicles` filtered to status ≠ `Retired`, label `plate — make model`), Start date, End date. Below the form, a read-only hint line: estimated amount = days × `daily_rate` of the selected vehicle (display only; the DB value is the truth).
  - `/bookings/[id]` (DESIGN.md §8.3): details card, payments table, and buttons depending on status: Reserved → "Activate" (`btn btn-primary`) and "Cancel Booking" (`btn btn-danger`); Active → "Mark Completed" (`btn btn-primary`); others none. A "Record Payment" card (amount, method select Cash/Card/UPI) shown unless status is Cancelled. DB error messages are shown in `Alert`.
- Acceptance criteria: the demo path steps 3–6 in BUILD.md can be executed using only these pages.

### Task 6: Payments page
- What to build: `/payments` list (DESIGN.md §8.1) with columns Payment #, Booking #, Customer, Amount (numeric), Method, Paid On (`formatDate`). No create form on this page.

### Task 7: Showcase queries (`db/queries_b.sql`)
Exactly 5 queries with `-- Q<n>:` comments: (1) booking details with customer and vehicle via 3-table JOIN; (2) total paid and balance per booking using LEFT JOIN + GROUP BY; (3) vehicles with their revenue ranked using a window function `RANK() OVER (ORDER BY revenue DESC)`; (4) customers who booked more than once using a subquery with `IN`; (5) bookings overlapping a given date range using `daterange(...) && daterange(...)`.

### Task 8: `docs/normalization.md`
Per table: list functional dependencies, state the normal form reached (target 3NF), and explain why `bookings.total_amount` is a deliberate stored (derived) value (keeps historical price when category rates change). 1–2 paragraphs per table, no more.

## Contracts You Must Honor
BUILD.md sections: schema, rules R1–R10, `fn_booking_total`, API conventions, endpoints owned by B, DESIGN.md in full.

## DO NOT
- Do not build anything outside your scope list
- Do not modify files owned by other teammates (including `src/lib/*`, `src/components/*`, `db/schema.sql`)
- Do not change the shared contract definitions
- Do not add packages without updating the master BUILD.md first
- Do not compute `total_amount`, status changes, overlap or balance checks in JavaScript
- Do not add an edit-booking or delete-booking feature
