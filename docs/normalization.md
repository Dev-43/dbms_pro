# Database Normalization Analysis — Vehicle Rental & Fleet Management System

This document outlines the formal normalization analysis for all eight tables in the relational database.

---

## 1. `users`
* **Attributes**: `user_id`, `full_name`, `email`, `password_hash`, `role`
* **Functional Dependencies**:
  * `user_id -> full_name, email, password_hash, role`
  * `email -> user_id, full_name, password_hash, role`
* **Normal Form**: **BCNF (Boyce-Codd Normal Form)**
* **Explanation**: All attributes are atomic (1NF). The table has single-attribute candidate keys (`user_id` and `email`), eliminating any possibility of partial functional dependencies (2NF). Every non-trivial functional dependency has a determinant that is a superkey (3NF & BCNF).

---

## 2. `vehicle_categories`
* **Attributes**: `category_id`, `name`, `daily_rate`
* **Functional Dependencies**:
  * `category_id -> name, daily_rate`
  * `name -> category_id, daily_rate`
* **Normal Form**: **BCNF**
* **Explanation**: Candidate keys are `category_id` and unique `name`. Both are superkeys. There are no transitive dependencies.

---

## 3. `vehicles`
* **Attributes**: `vehicle_id`, `plate_no`, `make`, `model`, `year`, `category_id`, `odometer_km`, `status`
* **Functional Dependencies**:
  * `vehicle_id -> plate_no, make, model, year, category_id, odometer_km, status`
  * `plate_no -> vehicle_id, make, model, year, category_id, odometer_km, status`
* **Normal Form**: **BCNF**
* **Explanation**: `category_id` is a foreign key referencing `vehicle_categories`. The category rate is deliberately normalized into `vehicle_categories` rather than stored in `vehicles`, preventing transitive dependencies (`vehicle_id -> category_id -> daily_rate`).

---

## 4. `customers`
* **Attributes**: `customer_id`, `full_name`, `email`, `phone`, `license_no`, `license_expiry`
* **Functional Dependencies**:
  * `customer_id -> full_name, email, phone, license_no, license_expiry`
  * `email -> customer_id, full_name, phone, license_no, license_expiry`
  * `license_no -> customer_id, full_name, email, phone, license_expiry`
* **Normal Form**: **BCNF**
* **Explanation**: All three unique identifiers (`customer_id`, `email`, `license_no`) are superkeys. All non-key attributes functionally depend directly on these keys with no transitive chains.

---

## 5. `bookings`
* **Attributes**: `booking_id`, `customer_id`, `vehicle_id`, `start_date`, `end_date`, `returned_on`, `status`, `total_amount`, `created_by`
* **Functional Dependencies**:
  * `booking_id -> customer_id, vehicle_id, start_date, end_date, returned_on, status, total_amount, created_by`
* **Normal Form**: **3NF**
* **Design Note on `total_amount` (Intentional Derivation)**:
  `total_amount` is calculated upon reservation creation as `(end_date - start_date) * vehicle_categories.daily_rate`. While in strict mathematical normalization derived values can be recomputed dynamically, storing `total_amount` is an essential industry practice: if vehicle category pricing increases in the future, existing past bookings must retain their historical agreed contract price. PostgreSQL trigger `trg_booking_validate` enforces that clients cannot tamper with this value.

---

## 6. `payments`
* **Attributes**: `payment_id`, `booking_id`, `amount`, `method`, `paid_on`
* **Functional Dependencies**:
  * `payment_id -> booking_id, amount, method, paid_on`
* **Normal Form**: **BCNF**
* **Explanation**: `payment_id` is the single-attribute primary key. Customer and vehicle information are normalized into `bookings` rather than duplicated in `payments`.

---

## 7. `maintenance`
* **Attributes**: `maintenance_id`, `vehicle_id`, `description`, `cost`, `opened_on`, `closed_on`
* **Functional Dependencies**:
  * `maintenance_id -> vehicle_id, description, cost, opened_on, closed_on`
* **Normal Form**: **BCNF**
* **Explanation**: All maintenance details depend on `maintenance_id`. Vehicle attributes are referenced solely through foreign key `vehicle_id`.

---

## 8. `fuel_logs`
* **Attributes**: `fuel_id`, `vehicle_id`, `litres`, `cost`, `logged_on`
* **Functional Dependencies**:
  * `fuel_id -> vehicle_id, litres, cost, logged_on`
* **Normal Form**: **BCNF**
* **Explanation**: Represents atomic fuel purchase events for an asset. `fuel_id` is the primary key.

