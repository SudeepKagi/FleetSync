/**
 * vehicleHelpers.js: SQL queries and utility functions for vehicle telemetry and relations.
 * Called by: vehicles.controller.js to keep route handlers lean and focused.
 */

// SQL query returning all vehicles with latest GPS position and geofence coordinates
const QUERY_ALL_VEHICLES = `
  SELECT v.*,
         d.name AS driver_name,
         d.license_number AS driver_license,
         COALESCE(loc.latitude, gz.center_lat, 37.7749) AS current_lat,
         COALESCE(loc.longitude, gz.center_lng, -122.4194) AS current_lng
  FROM vehicles v
  LEFT JOIN drivers d ON v.driver_id = d.id
  LEFT JOIN geofence_zones gz ON gz.vehicle_id = v.id
  LEFT JOIN LATERAL (
    SELECT latitude, longitude FROM vehicle_locations
    WHERE vehicle_id = v.id
    ORDER BY recorded_at DESC
    LIMIT 1
  ) loc ON true
  ORDER BY v.created_at DESC
`;

// SQL query returning active vehicles for real-time map rendering
const QUERY_LATEST_LOCATIONS = `
  SELECT
    v.id AS vehicle_id,
    v.registration_number,
    v.make,
    v.model,
    v.status,
    d.name AS driver_name,
    COALESCE(loc.latitude, gz.center_lat, 37.7749) AS latitude,
    COALESCE(loc.longitude, gz.center_lng, -122.4194) AS longitude,
    COALESCE(loc.recorded_at, NOW()) AS recorded_at,
    gz.center_lat AS geofence_lat,
    gz.center_lng AS geofence_lng,
    COALESCE(gz.radius_km, 15) AS geofence_radius_km
  FROM vehicles v
  LEFT JOIN drivers d ON v.driver_id = d.id
  LEFT JOIN geofence_zones gz ON gz.vehicle_id = v.id
  LEFT JOIN LATERAL (
    SELECT latitude, longitude, recorded_at FROM vehicle_locations
    WHERE vehicle_id = v.id
    ORDER BY recorded_at DESC
    LIMIT 1
  ) loc ON true
  WHERE v.status = 'active'
`;

/**
 * Calculates remaining days until predicted service date.
 * @param {string|Date} predictedDate
 * @returns {number}
 */
function calculateDaysRemaining(predictedDate) {
  if (!predictedDate) return 0;
  return Math.max(0, Math.round((new Date(predictedDate) - new Date()) / (1000 * 60 * 60 * 24)));
}

/**
 * Creates default circular geofence zone for a new vehicle if not present.
 */
async function ensureDefaultGeofence(pool, vehicleId) {
  await pool.query(`
    INSERT INTO geofence_zones (vehicle_id, center_lat, center_lng, radius_km)
    VALUES ($1, 37.7749, -122.4194, 15.0)
    ON CONFLICT (vehicle_id) DO NOTHING
  `, [vehicleId]);
}

module.exports = {
  QUERY_ALL_VEHICLES,
  QUERY_LATEST_LOCATIONS,
  calculateDaysRemaining,
  ensureDefaultGeofence,
};
