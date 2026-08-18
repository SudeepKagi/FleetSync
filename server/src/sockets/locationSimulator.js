/**
 * locationSimulator.js: Simulates real-time GPS movement and triggers geofence alarms.
 * Called by: server.js
 */

const pool = require('../config/db');
const { getIO } = require('./index');

// Haversine formula to compute great-circle distance in km between two lat/lng points
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let simulationInterval = null;

function startLocationSimulator() {
  console.log('📍 Starting GPS Location Simulator (simulating fleet movement every 6 seconds)...');

  simulationInterval = setInterval(async () => {
    try {
      let io;
      try {
        io = getIO();
      } catch {
        return; // Socket not ready
      }

      // Fetch active vehicles with their latest position and geofence
      const query = `
        SELECT
          v.id, v.registration_number, v.make, v.model, v.status, v.driver_id,
          d.name AS driver_name, d.user_id AS driver_user_id,
          COALESCE(loc.latitude, 37.7749) AS last_lat,
          COALESCE(loc.longitude, -122.4194) AS last_lng,
          gz.center_lat, gz.center_lng, gz.radius_km
        FROM vehicles v
        LEFT JOIN drivers d ON v.driver_id = d.id
        LEFT JOIN LATERAL (
          SELECT latitude, longitude FROM vehicle_locations
          WHERE vehicle_id = v.id
          ORDER BY recorded_at DESC
          LIMIT 1
        ) loc ON true
        LEFT JOIN geofence_zones gz ON gz.vehicle_id = v.id
        WHERE v.status = 'active';
      `;

      const result = await pool.query(query);
      const vehicles = result.rows;

      for (const v of vehicles) {
        // Nudge position slightly with random walk (approx 50-150 meters)
        const latDelta = (Math.random() - 0.5) * 0.0018;
        const lngDelta = (Math.random() - 0.5) * 0.0018;
        const newLat = Number((Number(v.last_lat) + latDelta).toFixed(6));
        const newLng = Number((Number(v.last_lng) + lngDelta).toFixed(6));

        // Save position
        await pool.query(
          `INSERT INTO vehicle_locations (vehicle_id, latitude, longitude, recorded_at)
           VALUES ($1, $2, $3, NOW())`,
          [v.id, newLat, newLng]
        );

        const locationPayload = {
          vehicle_id: v.id,
          registration_number: v.registration_number,
          make: v.make,
          model: v.model,
          driver_name: v.driver_name,
          latitude: newLat,
          longitude: newLng,
          recorded_at: new Date().toISOString(),
        };

        // Emit live location update
        io.to('managers').emit('vehicle:location', locationPayload);
        if (v.driver_user_id) {
          io.to(`driver:${v.driver_user_id}`).emit('vehicle:location', locationPayload);
        }

        // Check Geofence Breach
        if (v.center_lat && v.center_lng && v.radius_km) {
          const distKm = calculateHaversineDistance(
            newLat,
            newLng,
            Number(v.center_lat),
            Number(v.center_lng)
          );

          if (distKm > Number(v.radius_km)) {
            const breachPayload = {
              vehicle_id: v.id,
              registration_number: v.registration_number,
              driver_name: v.driver_name || 'Unassigned',
              current_distance_km: Number(distKm.toFixed(2)),
              allowed_radius_km: Number(v.radius_km),
              latitude: newLat,
              longitude: newLng,
              timestamp: new Date().toISOString(),
              message: `⚠️ Geofence breach! Vehicle ${v.registration_number} is ${distKm.toFixed(1)} km from base (allowed: ${v.radius_km} km).`,
            };

            io.to('managers').emit('vehicle:geofence-breach', breachPayload);
          }
        }
      }
    } catch (err) {
      console.warn('GPS Simulation tick warning:', err.message);
    }
  }, 6000);
}

function stopLocationSimulator() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

module.exports = { startLocationSimulator, stopLocationSimulator };
