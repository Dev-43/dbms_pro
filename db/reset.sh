#!/usr/bin/env bash
# reset.sh (OWNER: Person A) — drops and recreates the database, then loads every SQL file in order.
# Usage: bash db/reset.sh
# Override connection with: PG_URL="postgresql://user:pass@localhost:5432" DB_NAME=rental_fleet bash db/reset.sh
set -euo pipefail
DB_NAME="${DB_NAME:-rental_fleet}"
PG_URL="${PG_URL:-postgresql://postgres:postgres@localhost:5432}"
cd "$(dirname "$0")"

psql "$PG_URL/postgres" -v ON_ERROR_STOP=1 -q \
  -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);" \
  -c "CREATE DATABASE $DB_NAME;"

for f in schema.sql triggers_vehicle.sql triggers_booking.sql triggers_maintenance.sql \
         views.sql seed_a.sql seed_b.sql seed_c.sql; do
  echo "Running $f"
  psql "$PG_URL/$DB_NAME" -v ON_ERROR_STOP=1 -q -f "$f"
done
echo "Database $DB_NAME is ready."
