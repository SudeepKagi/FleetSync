-- ============================================================
-- FleetSync — Migration 002: Triggers & Stored Procedures
-- ============================================================

-- ─────────────────────────────────────────────
-- TRIGGER 1: Auto-flag vehicle as 'in_service' on severe issue
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_flag_severe_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.severity = 'severe' THEN
    UPDATE vehicles
    SET status = 'in_service'
    WHERE id = NEW.vehicle_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_severe_issue ON issues;
CREATE TRIGGER trg_severe_issue
  AFTER INSERT ON issues
  FOR EACH ROW
  EXECUTE FUNCTION fn_flag_severe_issue();


-- ─────────────────────────────────────────────
-- STORED PROCEDURE 1: check_maintenance_due()
-- Loops all active vehicles; inserts maintenance_alerts for:
--   (a) odometer gap >= 5000 km (or service_interval_km)
--   (b) last_service_date older than 90 days
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_maintenance_due()
RETURNS TEXT AS $$
DECLARE
  v              RECORD;
  odometer_gap   INT;
  days_since     INT;
  alerts_created INT := 0;
  alert_exists   BOOLEAN;
  interval_limit INT;
BEGIN
  FOR v IN
    SELECT id, registration_number, current_odometer_km,
           last_service_odometer_km, last_service_date,
           COALESCE(service_interval_km, 5000) AS service_interval_km
    FROM vehicles
    WHERE status = 'active'
  LOOP
    interval_limit := v.service_interval_km;
    odometer_gap := v.current_odometer_km - v.last_service_odometer_km;

    -- Check 1: Odometer threshold
    IF odometer_gap >= interval_limit THEN
      SELECT EXISTS (
        SELECT 1 FROM maintenance_alerts
        WHERE vehicle_id = v.id
          AND alert_type = 'odometer_due'
          AND is_resolved = FALSE
      ) INTO alert_exists;

      IF NOT alert_exists THEN
        INSERT INTO maintenance_alerts (vehicle_id, alert_type, message)
        VALUES (
          v.id,
          'odometer_due',
          format(
            'Vehicle %s is due for service: %s km since last service (threshold: %s km).',
            v.registration_number,
            odometer_gap,
            interval_limit
          )
        );
        alerts_created := alerts_created + 1;
      END IF;
    END IF;

    -- Check 2: Date threshold (90 days)
    IF v.last_service_date IS NOT NULL THEN
      days_since := CURRENT_DATE - v.last_service_date;

      IF days_since >= 90 THEN
        SELECT EXISTS (
          SELECT 1 FROM maintenance_alerts
          WHERE vehicle_id = v.id
            AND alert_type = 'date_overdue'
            AND is_resolved = FALSE
        ) INTO alert_exists;

        IF NOT alert_exists THEN
          INSERT INTO maintenance_alerts (vehicle_id, alert_type, message)
          VALUES (
            v.id,
            'date_overdue',
            format(
              'Vehicle %s has not been serviced in %s days (last service: %s).',
              v.registration_number,
              days_since,
              v.last_service_date
            )
          );
          alerts_created := alerts_created + 1;
        END IF;
      END IF;
    END IF;

    -- Check 3: Never serviced
    IF v.last_service_date IS NULL AND v.current_odometer_km >= interval_limit THEN
      SELECT EXISTS (
        SELECT 1 FROM maintenance_alerts
        WHERE vehicle_id = v.id
          AND alert_type = 'never_serviced'
          AND is_resolved = FALSE
      ) INTO alert_exists;

      IF NOT alert_exists THEN
        INSERT INTO maintenance_alerts (vehicle_id, alert_type, message)
        VALUES (
          v.id,
          'never_serviced',
          format(
            'Vehicle %s has never been serviced and has %s km on odometer.',
            v.registration_number,
            v.current_odometer_km
          )
        );
        alerts_created := alerts_created + 1;
      END IF;
    END IF;

  END LOOP;

  RETURN format('check_maintenance_due() complete: %s alert(s) created.', alerts_created);
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────
-- STORED PROCEDURE 2: predict_service_date(p_vehicle_id INT)
-- Computes rolling km/day and predicts exact calendar date for next service limit.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION predict_service_date(p_vehicle_id INT)
RETURNS DATE AS $$
DECLARE
  v_rec          RECORD;
  v_count        INT;
  v_min_date     DATE;
  v_max_date     DATE;
  v_min_odo      INT;
  v_max_odo      INT;
  v_days_span    INT;
  v_km_diff      INT;
  v_km_per_day   NUMERIC(10,2);
  v_remaining_km INT;
  v_days_left    INT;
  v_due_date     DATE;
BEGIN
  -- 1. Fetch vehicle info
  SELECT id, current_odometer_km, last_service_odometer_km,
         COALESCE(service_interval_km, 5000) AS service_interval_km
  INTO v_rec
  FROM vehicles
  WHERE id = p_vehicle_id;

  IF NOT FOUND THEN
    RETURN CURRENT_DATE + INTERVAL '30 days';
  END IF;

  -- 2. Analyze service records history
  SELECT COUNT(*), MIN(service_date), MAX(service_date), MIN(odometer_km), MAX(odometer_km)
  INTO v_count, v_min_date, v_max_date, v_min_odo, v_max_odo
  FROM service_records
  WHERE vehicle_id = p_vehicle_id;

  -- Calculate remaining km until threshold
  v_remaining_km := v_rec.service_interval_km - (v_rec.current_odometer_km - v_rec.last_service_odometer_km);
  IF v_remaining_km <= 0 THEN
    -- Already overdue or due today
    RETURN CURRENT_DATE;
  END IF;

  -- Check if we have at least 2 service records with valid date span
  IF v_count >= 2 AND v_max_date > v_min_date AND v_max_odo > v_min_odo THEN
    v_days_span := v_max_date - v_min_date;
    v_km_diff := v_max_odo - v_min_odo;
    v_km_per_day := (v_km_diff::NUMERIC / v_days_span::NUMERIC);
  ELSE
    -- Fallback: estimate from current odometer and creation date (or default 45 km/day)
    v_km_per_day := 45.0;
  END IF;

  IF v_km_per_day <= 0 THEN
    v_km_per_day := 45.0;
  END IF;

  v_days_left := ROUND(v_remaining_km / v_km_per_day);
  IF v_days_left <= 0 THEN
    v_days_left := 1;
  END IF;

  v_due_date := CURRENT_DATE + (v_days_left || ' days')::INTERVAL;
  RETURN v_due_date;
END;
$$ LANGUAGE plpgsql;
