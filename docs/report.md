# Project Report — Vehicle Rental & Fleet Management System

## 1. Introduction
The Vehicle Rental & Fleet Management System is an enterprise database application built to streamline operations for commercial vehicle rental companies. The platform manages vehicle inventory, customer documentation, reservation lifecycles, maintenance work orders, fuel logging, and financial ledgers. Unlike standard web applications where business validation lives loosely in server scripts, this system enforces business rules directly at the relational database layer.

## 2. Problem Statement
Commercial car rental operations face critical operational and safety hazards if software permits data inconsistencies. Common failures in decoupled architectures include vehicle double-booking across overlapping calendar windows, renting vehicles actively undergoing mechanical repairs, accepting reservations for drivers with expired licences, and accepting payments exceeding booking balances. This project establishes a single source of truth inside the PostgreSQL engine to mathematically guarantee that invalid states cannot be committed.

## 3. Tech Stack
The backend is built with PostgreSQL 15+ utilizing the `btree_gist` and `pgcrypto` extensions. PostgreSQL was selected because of its native support for temporal GiST exclusion constraints (preventing date overlap), procedural PL/pgSQL triggers, and high-performance analytical views. The application layer uses Next.js 14 App Router (JavaScript) with raw SQL executed through a pooled `pg` client, avoiding ORM abstraction penalties. Authentication employs salted Blowfish password hashes (`bcryptjs`) and signed HS256 JWT sessions (`jose`).

## 4. Schema Overview
The relational architecture comprises eight normalized tables in 3NF/BCNF: `users` (staff & admin accounts), `vehicle_categories` (vehicle classes and daily rates), `vehicles` (fleet asset tracking), `customers` (verified driver profiles), `bookings` (reservations and rental contracts), `payments` (multi-mode ledger entries), `maintenance` (workshop work orders), and `fuel_logs` (asset operating fuel expenses). Referential integrity is secured with `ON DELETE RESTRICT` constraints, and surrogate integer primary keys eliminate partial key dependencies.

## 5. Database Rules (R1–R15)
| # | Rule | Enforcement Mechanism | Exact System Behavior |
|---|---|---|---|
| R1 | No overlapping bookings for the same vehicle | `EXCLUDE USING gist` constraint | Prevents concurrent duplicate rentals across identical date intervals. |
| R2 | Vehicle cannot be booked if `In Shop` or `Retired` | `trg_booking_validate` (BEFORE INSERT) | Rejects booking with `Vehicle is not available for booking`. |
| R3 | Customer driving licence must be valid until end date | `trg_booking_validate` (BEFORE INSERT) | Rejects booking with `Customer licence expires before return date`. |
| R4 | Rental start date cannot be in the past | `trg_booking_validate` (BEFORE INSERT) | Rejects booking with `Start date cannot be in the past`. |
| R5 | Booking total is calculated by database | `trg_booking_validate` (BEFORE INSERT) | Invokes `fn_booking_total`; client value is ignored. |
| R6 | Strict booking status state machine | `trg_booking_transition` (BEFORE UPDATE) | Only allows Reserved->Active/Cancelled and Active->Completed. |
| R7 | Reserved->Active requires vehicle `Available` | `trg_booking_transition` (BEFORE UPDATE) | Confirms vehicle availability before client key handover. |
| R8 | Vehicle status automatically synced with bookings | `trg_booking_sync` (AFTER UPDATE) | Active sets vehicle `Rented`; Completed restores `Available` or `In Shop`. |
| R9 | Total payments cannot exceed booking total | `trg_payment_check` (BEFORE INSERT) | Blocks overpayments with `Payment exceeds outstanding balance`. |
| R10 | No payments allowed on cancelled bookings | `trg_payment_check` (BEFORE INSERT) | Rejects with `Cannot pay a cancelled booking`. |
| R11 | No maintenance on `Rented` or `Retired` vehicles | `trg_maintenance_open` (BEFORE INSERT) | Rejects ticket creation on unavailable assets. |
| R12 | Opening maintenance sets vehicle to `In Shop` | `trg_maintenance_sync` (AFTER INSERT) | Automatically locks vehicle out of available rental inventory. |
| R13 | Closing maintenance restores vehicle to `Available` | `trg_maintenance_sync` (AFTER UPDATE) | Restores availability if no other open tickets exist. |
| R14 | Closed maintenance tickets cannot be modified | `trg_maintenance_open` (BEFORE UPDATE) | Rejects updates with `Maintenance record is already closed`. |
| R15 | Cannot retire vehicle with active bookings or repairs | `trg_vehicle_retire_guard` (BEFORE UPDATE) | Rejects with `Vehicle has open bookings or maintenance`. |

## 6. Views & Showcase Queries
Four database views provide instant reporting without application calculation: `v_available_vehicles` (active fleet inventory ready for dispatch), `v_vehicle_profit` (gross rental revenue minus workshop repairs and fuel expenses), `v_monthly_revenue` (monthly financial collections), and `v_overdue_returns` (active rentals past their contracted return date). Fifteen showcase SQL queries demonstrate advanced relational techniques including three-table inner joins, left outer joins for unbooked assets, group-by aggregates with `HAVING` filters, date arithmetic expressions, window functions (`RANK() OVER`), and range overlap operators (`&&`).

## 7. Demo Walkthrough
1. **Login**: Authenticate as `admin@rental.local` to view executive KPI tiles and overdue alerts.
2. **Fleet Registration**: Register a vehicle and customer with valid driving licence dates.
3. **Reservation**: Create a booking for future dates; verify that total amount is calculated automatically by the database.
4. **Collision Check**: Attempt creating a second booking for overlapping dates; verify immediate rejection by PostgreSQL rule R1.
5. **Pickup & Payment**: Transition reservation to `Active`; confirm vehicle status automatically switches to `Rented`. Record a partial payment and verify overflow protection (R9).
6. **Return**: Mark booking `Completed`; confirm vehicle status restores to `Available`.
7. **Maintenance**: Open a workshop ticket; verify vehicle switches to `In Shop` and rejects booking attempts. Close ticket to restore vehicle availability.
8. **Reports**: Inspect the Reports view to analyze realized vehicle profitability and monthly income trends.

## 8. Conclusion
The Vehicle Rental & Fleet Management System demonstrates the power of relational database engineering in enterprise workflows. By moving business constraints into PostgreSQL, the application achieves zero-defect consistency, impervious to client bypass or concurrent race conditions. The project provides an extensible foundation ready for IoT telematics and customer-facing mobile extensions.

