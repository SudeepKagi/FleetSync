-- ============================================================
-- FleetSync — Migration 003: Seed Data
-- Default password for ALL demo users: Password123!
-- ============================================================

-- ── USERS ──────────────────────────────────────────────────
INSERT INTO users (id, name, email, password_hash, role) VALUES
  (1, 'Super Admin', 'admin@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'admin'),
  (2, 'Sarah Jenkins', 'manager@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'fleet_manager'),
  (3, 'Marcus Vance', 'marcus@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'driver'),
  (4, 'Elena Rostova', 'elena@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'driver'),
  (5, 'Devon Miles', 'devon@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'driver'),
  (6, 'Tanya O''Connor', 'tanya@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'driver'),
  (7, 'Liam Chen', 'liam@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'driver'),
  (8, 'Amara Okafor', 'amara@fleetsync.com', '$2a$10$UPANVJ7qwEAeM/8FlAAwseLtctUTLB1mrSuqvlgQW8W9eZWOIQXW.', 'driver')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ── DRIVERS (linked 1:1 to driver users) ───────────────────
INSERT INTO drivers (id, user_id, name, license_number, phone) VALUES
  (1, 3, 'James Carter', 'DL-001-JC',  '+1-555-0101'),
  (2, 4, 'Maria Gomez',  'DL-002-MG',  '+1-555-0102'),
  (3, 5, 'Liam Okafor',  'DL-003-LO',  '+1-555-0103'),
  (4, 6, 'Sara Patel',   'DL-004-SP',  '+1-555-0104'),
  (5, 7, 'Ben Müller',   'DL-005-BM',  '+1-555-0105'),
  (6, 8, 'Anya Ivanova', 'DL-006-AI',  '+1-555-0106');
SELECT setval('drivers_id_seq', (SELECT MAX(id) FROM drivers));

-- ── VEHICLES ───────────────────────────────────────────────
INSERT INTO vehicles
  (id, registration_number, make, model, year, current_odometer_km,
   driver_id, last_service_odometer_km, last_service_date, service_interval_km, status)
VALUES
  (1, 'FS-001-AA', 'Toyota',     'Hilux',     2022, 15200,  1, 14800, CURRENT_DATE - INTERVAL '10 days',  5000, 'active'),
  (2, 'FS-002-BB', 'Ford',       'Ranger',    2021, 22500,  2, 22000, CURRENT_DATE - INTERVAL '30 days',  5000, 'active'),
  (3, 'FS-003-CC', 'Honda',      'CR-V',      2020, 48700,  3, 43000, CURRENT_DATE - INTERVAL '45 days',  5000, 'active'),
  (4, 'FS-004-DD', 'Nissan',     'Navara',    2019, 67200,  4, 61000, CURRENT_DATE - INTERVAL '60 days',  6000, 'active'),
  (5, 'FS-005-EE', 'Mitsubishi', 'Triton',    2023, 9800,   5, 9500,  CURRENT_DATE - INTERVAL '95 days',  5000, 'active'),
  (6, 'FS-006-FF', 'Isuzu',      'D-Max',     2022, 31000,  6, 30000, CURRENT_DATE - INTERVAL '120 days', 5000, 'active'),
  (7, 'FS-007-GG', 'Volkswagen', 'Amarok',    2021, 55000,  NULL, 50000, CURRENT_DATE - INTERVAL '20 days',  7500, 'active'),
  (8, 'FS-008-HH', 'Mazda',      'BT-50',     2018, 112000, NULL, 110000, CURRENT_DATE - INTERVAL '200 days', 5000, 'retired');
SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));

-- ── SERVICE RECORDS (Historical data across past months for analytics) ──────
INSERT INTO service_records (vehicle_id, service_date, odometer_km, description, cost) VALUES
  (1, CURRENT_DATE - INTERVAL '180 days', 9800,  'Full 10,000km scheduled service & inspection',   450.00),
  (1, CURRENT_DATE - INTERVAL '90 days',  12400, 'Tire rotation and brake check',                   180.00),
  (1, CURRENT_DATE - INTERVAL '10 days',  14800, 'Engine oil flush and air filter replacement',     140.00),

  (2, CURRENT_DATE - INTERVAL '150 days', 16000, 'Transmission oil check & suspension alignment',   320.00),
  (2, CURRENT_DATE - INTERVAL '80 days',  19500, 'Brake pad replacement and hydraulic fluid flush', 280.00),
  (2, CURRENT_DATE - INTERVAL '30 days',  22000, 'Standard synthetic oil & filter change',          150.00),

  (3, CURRENT_DATE - INTERVAL '240 days', 32000, 'Major 30,000km scheduled maintenance',           620.00),
  (3, CURRENT_DATE - INTERVAL '140 days', 38000, 'Timing belt & water pump replacement',           780.00),
  (3, CURRENT_DATE - INTERVAL '45 days',  43000, 'Oil service, cabin filter & battery check',      110.00),

  (4, CURRENT_DATE - INTERVAL '200 days', 52000, 'Brake rotors & pad replacements',                 480.00),
  (4, CURRENT_DATE - INTERVAL '120 days', 57000, 'Alternator inspection & drive belt replacement',  340.00),
  (4, CURRENT_DATE - INTERVAL '60 days',  61000, 'Synthetic oil change & coolant flush',            160.00),

  (5, CURRENT_DATE - INTERVAL '190 days', 4800,  'Initial warranty inspection & oil service',         0.00),
  (5, CURRENT_DATE - INTERVAL '95 days',  9500,  'Standard service & wheel balancing',              190.00),

  (6, CURRENT_DATE - INTERVAL '220 days', 21000, 'Fuel injector cleaning & spark plugs',            380.00),
  (6, CURRENT_DATE - INTERVAL '120 days', 30000, 'Oil change, heavy duty battery replacement',      320.00),

  (7, CURRENT_DATE - INTERVAL '110 days', 42000, 'Suspension bushing replacement',                 510.00),
  (7, CURRENT_DATE - INTERVAL '20 days',  50000, 'Major 50,000km differential & engine overhaul',    950.00);

-- ── ISSUES ──────────────────────────────────────────────────
INSERT INTO issues (id, vehicle_id, reported_by, damage_type, severity, title, description, status) VALUES
  (1, 1, 3, 'bumper', 'minor',
   'Front Bumper Scuff',
   'Small paint scratch on front right bumper from low curb during delivery parking.',
   'open'),

  (2, 3, 5, 'windshield', 'moderate',
   'Cracked Windshield — Passenger Side',
   'Highway gravel chip expanded into a 15cm diagonal crack. Visibility slightly impaired on passenger side.',
   'in_progress'),

  (3, 7, 1, 'engine', 'severe',
   'Severe Engine Overheating & Loss of Power',
   'Vehicle experienced sudden coolant temperature spike and engine stall on motorway. Towed to workshop.',
   'open'),

  (4, 2, 4, 'mirror', 'minor',
   'Driver Side Mirror Housing Loose',
   'External side mirror vibrated loose after tight alleyway maneuver. Glass intact.',
   'resolved'),

  (5, 4, 6, 'tire', 'moderate',
   'Rear Left Tire Low Pressure & Sidewall Bulge',
   'Tire pressure sensor triggered. Sidewall inspection revealed small bubble. Needs replacement.',
   'open');
SELECT setval('issues_id_seq', (SELECT MAX(id) FROM issues));

-- ── GEOFENCE ZONES (Center around SF / Bay Area coordinates) ──
INSERT INTO geofence_zones (vehicle_id, center_lat, center_lng, radius_km) VALUES
  (1, 37.7749, -122.4194, 15.0),
  (2, 37.7833, -122.4167, 18.0),
  (3, 37.8044, -122.2712, 12.0),
  (4, 37.6879, -122.4702, 20.0),
  (5, 37.3382, -121.8863, 15.0),
  (6, 37.5485, -121.9886, 16.0),
  (7, 37.7749, -122.4194, 10.0),
  (8, 37.7749, -122.4194, 25.0);

-- ── VEHICLE LOCATIONS (Initial live positions) ───────────────
INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, recorded_at) VALUES
  (1, 37.7790, -122.4180, NOW() - INTERVAL '2 minutes'),
  (2, 37.7850, -122.4100, NOW() - INTERVAL '2 minutes'),
  (3, 37.8010, -122.2680, NOW() - INTERVAL '2 minutes'),
  (4, 37.6900, -122.4650, NOW() - INTERVAL '2 minutes'),
  (5, 37.3400, -121.8800, NOW() - INTERVAL '2 minutes'),
  (6, 37.5500, -121.9800, NOW() - INTERVAL '2 minutes'),
  (7, 37.7710, -122.4220, NOW() - INTERVAL '2 minutes');

-- ── AUDIT LOG INITIAL SEED ──────────────────────────────────
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES
  (1, 'system.init',     'system',   1, '{"message": "FleetSync initialized with default fleet policy."}'),
  (1, 'vehicle.create',  'vehicle',  1, '{"registration_number": "FS-001-AA", "make": "Toyota", "model": "Hilux"}'),
  (2, 'driver.assign',   'driver',   1, '{"driver_name": "James Carter", "vehicle_id": 1}'),
  (3, 'issue.create',    'issue',    1, '{"title": "Front Bumper Scuff", "severity": "minor"}');
