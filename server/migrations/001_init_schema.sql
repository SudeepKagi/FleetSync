-- ============================================================
-- FleetSync — Migration 001: Initial Schema
-- ============================================================

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS geofence_zones CASCADE;
DROP TABLE IF EXISTS vehicle_locations CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS maintenance_alerts CASCADE;
DROP TABLE IF EXISTS service_records CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─────────────────────────────────────────────
-- 1. users — auth/login table for all roles
-- ─────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'fleet_manager', 'driver')),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. drivers — profile data, 1:1 with a driver user
-- ─────────────────────────────────────────────
CREATE TABLE drivers (
  id             SERIAL PRIMARY KEY,
  user_id        INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name           VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  phone          VARCHAR(15),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 3. vehicles
-- ─────────────────────────────────────────────
CREATE TABLE vehicles (
  id                       SERIAL PRIMARY KEY,
  registration_number      VARCHAR(20) UNIQUE NOT NULL,
  make                     VARCHAR(50),
  model                    VARCHAR(50),
  year                     INT,
  current_odometer_km      INT DEFAULT 0,
  driver_id                INT REFERENCES drivers(id) ON DELETE SET NULL,
  last_service_odometer_km  INT DEFAULT 0,
  last_service_date        DATE,
  service_interval_km      INT DEFAULT 5000,
  status                   VARCHAR(20) DEFAULT 'active'
                             CHECK (status IN ('active', 'in_service', 'retired')),
  created_at               TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 4. service_records
-- ─────────────────────────────────────────────
CREATE TABLE service_records (
  id           SERIAL PRIMARY KEY,
  vehicle_id   INT REFERENCES vehicles(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  odometer_km  INT NOT NULL,
  description  TEXT,
  cost         NUMERIC(10,2),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 5. maintenance_alerts
-- ─────────────────────────────────────────────
CREATE TABLE maintenance_alerts (
  id          SERIAL PRIMARY KEY,
  vehicle_id  INT REFERENCES vehicles(id) ON DELETE CASCADE,
  alert_type  VARCHAR(50) NOT NULL,
  message     TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 6. issues — damage/problem reports
-- ─────────────────────────────────────────────
CREATE TABLE issues (
  id           SERIAL PRIMARY KEY,
  vehicle_id   INT REFERENCES vehicles(id) ON DELETE CASCADE,
  reported_by  INT REFERENCES users(id),
  damage_type  VARCHAR(30) CHECK (damage_type IN (
                  'bumper', 'mirror', 'windshield', 'tire',
                  'engine', 'body_paint', 'other'
               )),
  severity     VARCHAR(10) NOT NULL DEFAULT 'minor'
                 CHECK (severity IN ('minor', 'moderate', 'severe')),
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  photo_url    TEXT,
  status       VARCHAR(20) DEFAULT 'open'
                 CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 7. vehicle_locations (rolling GPS history)
-- ─────────────────────────────────────────────
CREATE TABLE vehicle_locations (
  id          SERIAL PRIMARY KEY,
  vehicle_id  INT REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude    NUMERIC(9,6) NOT NULL,
  longitude   NUMERIC(9,6) NOT NULL,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. geofence_zones (circular zone per vehicle)
-- ─────────────────────────────────────────────
CREATE TABLE geofence_zones (
  id          SERIAL PRIMARY KEY,
  vehicle_id  INT UNIQUE REFERENCES vehicles(id) ON DELETE CASCADE,
  center_lat  NUMERIC(9,6) NOT NULL,
  center_lng  NUMERIC(9,6) NOT NULL,
  radius_km   NUMERIC(6,2) NOT NULL DEFAULT 15,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 9. audit_log (system write operations)
-- ─────────────────────────────────────────────
CREATE TABLE audit_log (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id   INT,
  details     JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vehicles_driver_id       ON vehicles(driver_id);
CREATE INDEX idx_issues_vehicle_id        ON issues(vehicle_id);
CREATE INDEX idx_issues_reported_by       ON issues(reported_by);
CREATE INDEX idx_service_vehicle_id       ON service_records(vehicle_id);
CREATE INDEX idx_alerts_vehicle_id        ON maintenance_alerts(vehicle_id);
CREATE INDEX idx_drivers_user_id          ON drivers(user_id);
CREATE INDEX idx_vehicle_locations_vid    ON vehicle_locations(vehicle_id, recorded_at DESC);
CREATE INDEX idx_geofence_vehicle_id      ON geofence_zones(vehicle_id);
CREATE INDEX idx_audit_log_created        ON audit_log(created_at DESC);
