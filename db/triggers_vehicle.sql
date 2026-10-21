-- triggers_vehicle.sql (OWNER: Person A) — rule R15

CREATE OR REPLACE FUNCTION fn_vehicle_retire_guard() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'Retired' AND OLD.status <> 'Retired' THEN
    IF EXISTS (SELECT 1 FROM bookings
               WHERE vehicle_id = NEW.vehicle_id AND status IN ('Reserved','Active'))
       OR EXISTS (SELECT 1 FROM maintenance
                  WHERE vehicle_id = NEW.vehicle_id AND closed_on IS NULL) THEN
      RAISE EXCEPTION 'Vehicle has open bookings or maintenance';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vehicle_retire_guard
  BEFORE UPDATE OF status ON vehicles
  FOR EACH ROW EXECUTE FUNCTION fn_vehicle_retire_guard();
