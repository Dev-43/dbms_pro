-- triggers_maintenance.sql (OWNER: Person C) — rules R11–R14

-- R11 (INSERT) and R14 (UPDATE)
CREATE OR REPLACE FUNCTION fn_maintenance_open() RETURNS trigger AS $$
DECLARE
  v_status VARCHAR(10);
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status INTO v_status FROM vehicles WHERE vehicle_id = NEW.vehicle_id;
    IF v_status IN ('Rented','Retired') THEN
      RAISE EXCEPTION 'Cannot open maintenance on a rented or retired vehicle';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.closed_on IS NOT NULL THEN
      RAISE EXCEPTION 'Maintenance record is already closed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_open
  BEFORE INSERT OR UPDATE ON maintenance
  FOR EACH ROW EXECUTE FUNCTION fn_maintenance_open();

-- R12 (AFTER INSERT) and R13 (AFTER UPDATE)
CREATE OR REPLACE FUNCTION fn_maintenance_sync() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.closed_on IS NULL THEN
      UPDATE vehicles SET status = 'In Shop'
       WHERE vehicle_id = NEW.vehicle_id AND status = 'Available';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.closed_on IS NULL AND NEW.closed_on IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM maintenance
                       WHERE vehicle_id = NEW.vehicle_id
                         AND closed_on IS NULL
                         AND maintenance_id <> NEW.maintenance_id) THEN
      UPDATE vehicles SET status = 'Available'
       WHERE vehicle_id = NEW.vehicle_id AND status = 'In Shop';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_maintenance_sync
  AFTER INSERT OR UPDATE ON maintenance
  FOR EACH ROW EXECUTE FUNCTION fn_maintenance_sync();
