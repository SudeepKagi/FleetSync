/**
 * vehicles.controller.js: Handles CRUD operations, telemetry lookups, geofences, and predictive maintenance.
 * Called by: routes in vehicles.routes.js (/api/vehicles/*)
 */

const pool = require('../config/db');
const { logAudit } = require('../middleware/audit');
const {
  QUERY_ALL_VEHICLES,
  QUERY_LATEST_LOCATIONS,
  calculateDaysRemaining,
  ensureDefaultGeofence,
} = require('../utils/vehicleHelpers');

// GET /api/vehicles (Admin + Fleet Manager)
const getAllVehicles = async (req, res) => {
  try {
    const result = await pool.query(QUERY_ALL_VEHICLES);
    res.json(result.rows);
  } catch (err) {
    console.error('GetAllVehicles error:', err.message);
    res.status(500).json({ message: 'Server error fetching vehicles.' });
  }
};

// GET /api/vehicles/:id (Includes driver, service records, issues, alerts, predicted date)
const getVehicleById = async (req, res) => {
  const { id } = req.params;
  try {
    const vehicleRes = await pool.query(`
      SELECT v.*,
             d.name AS driver_name, d.license_number AS driver_license, d.phone AS driver_phone,
             gz.center_lat AS geofence_lat, gz.center_lng AS geofence_lng, gz.radius_km AS geofence_radius_km
      FROM vehicles v
      LEFT JOIN drivers d ON v.driver_id = d.id
      LEFT JOIN geofence_zones gz ON gz.vehicle_id = v.id
      WHERE v.id = $1
    `, [id]);

    if (vehicleRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    const [serviceRes, issuesRes, alertsRes] = await Promise.all([
      pool.query(`SELECT * FROM service_records WHERE vehicle_id = $1 ORDER BY service_date DESC`, [id]),
      pool.query(
        `SELECT i.*, u.name AS reporter_name FROM issues i
         LEFT JOIN users u ON i.reported_by = u.id
         WHERE i.vehicle_id = $1 ORDER BY i.created_at DESC`,
        [id]
      ),
      pool.query(`SELECT * FROM maintenance_alerts WHERE vehicle_id = $1 AND is_resolved = FALSE`, [id]),
    ]);

    let predictedDate = null;
    try {
      const predRes = await pool.query('SELECT predict_service_date($1) AS date', [id]);
      if (predRes.rows.length > 0 && predRes.rows[0].date) {
        predictedDate = predRes.rows[0].date;
      }
    } catch (e) {
      console.warn('Predictive calculation warning:', e.message);
    }

    res.json({
      ...vehicleRes.rows[0],
      predicted_service_date: predictedDate,
      service_records: serviceRes.rows,
      issues: issuesRes.rows,
      alerts: alertsRes.rows,
    });
  } catch (err) {
    console.error('GetVehicleById error:', err.message);
    res.status(500).json({ message: 'Server error fetching vehicle.' });
  }
};

// GET /api/vehicles/:id/predicted-service-date (Calls PL/pgSQL function predict_service_date)
const getPredictedServiceDate = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT predict_service_date($1) AS predicted_date', [id]);
    if (result.rows.length === 0 || !result.rows[0].predicted_date) {
      return res.status(404).json({ message: 'Unable to calculate predicted service date.' });
    }
    const predictedDate = result.rows[0].predicted_date;
    res.json({
      vehicle_id: Number(id),
      predicted_service_date: predictedDate,
      days_remaining: calculateDaysRemaining(predictedDate),
    });
  } catch (err) {
    console.error('getPredictedServiceDate error:', err.message);
    res.status(500).json({ message: 'Error calculating predicted service date.' });
  }
};

// GET /api/vehicles/:id/geofence
const getVehicleGeofence = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM geofence_zones WHERE vehicle_id = $1', [id]);
    res.json(result.rows[0] || { vehicle_id: Number(id), center_lat: 37.7749, center_lng: -122.4194, radius_km: 15, is_default: true });
  } catch (err) {
    console.error('getVehicleGeofence error:', err.message);
    res.status(500).json({ message: 'Error fetching geofence zone.' });
  }
};

// POST /api/vehicles/:id/geofence
const saveVehicleGeofence = async (req, res) => {
  const { id } = req.params;
  const { center_lat, center_lng, radius_km } = req.body;
  if (!center_lat || !center_lng || !radius_km) {
    return res.status(400).json({ message: 'center_lat, center_lng, and radius_km are required.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO geofence_zones (vehicle_id, center_lat, center_lng, radius_km)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (vehicle_id)
      DO UPDATE SET center_lat = EXCLUDED.center_lat, center_lng = EXCLUDED.center_lng, radius_km = EXCLUDED.radius_km
      RETURNING *
    `, [id, center_lat, center_lng, radius_km]);

    await logAudit(req.user?.id, 'geofence.update', 'geofence', id, { center_lat, center_lng, radius_km });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('saveVehicleGeofence error:', err.message);
    res.status(500).json({ message: 'Error saving geofence zone.' });
  }
};

// GET /api/vehicles/locations/latest
const getLatestLocations = async (req, res) => {
  try {
    const result = await pool.query(QUERY_LATEST_LOCATIONS);
    res.json(result.rows);
  } catch (err) {
    console.error('getLatestLocations error:', err.message);
    res.status(500).json({ message: 'Error retrieving live fleet locations.' });
  }
};

// POST /api/vehicles
const createVehicle = async (req, res) => {
  const {
    registration_number, make, model, year,
    current_odometer_km = 0, driver_id,
    last_service_odometer_km = 0, last_service_date,
    service_interval_km = 5000, status = 'active'
  } = req.body;

  if (!registration_number) {
    return res.status(400).json({ message: 'Registration number is required.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO vehicles
        (registration_number, make, model, year, current_odometer_km,
         driver_id, last_service_odometer_km, last_service_date, service_interval_km, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      registration_number, make, model, year, current_odometer_km,
      driver_id || null, last_service_odometer_km, last_service_date || null,
      service_interval_km, status
    ]);

    const created = result.rows[0];
    await ensureDefaultGeofence(pool, created.id);
    await logAudit(req.user?.id, 'vehicle.create', 'vehicle', created.id, { registration_number, make, model });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Registration number already exists.' });
    console.error('CreateVehicle error:', err.message);
    res.status(500).json({ message: 'Server error creating vehicle.' });
  }
};

// PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const {
    registration_number, make, model, year,
    current_odometer_km, driver_id,
    last_service_odometer_km, last_service_date,
    service_interval_km, status
  } = req.body;

  try {
    const result = await pool.query(`
      UPDATE vehicles SET
        registration_number     = COALESCE($1, registration_number),
        make                    = COALESCE($2, make),
        model                   = COALESCE($3, model),
        year                    = COALESCE($4, year),
        current_odometer_km     = COALESCE($5, current_odometer_km),
        driver_id               = $6,
        last_service_odometer_km= COALESCE($7, last_service_odometer_km),
        last_service_date       = COALESCE($8, last_service_date),
        service_interval_km     = COALESCE($9, service_interval_km),
        status                  = COALESCE($10, status)
      WHERE id = $11
      RETURNING *
    `, [
      registration_number, make, model, year, current_odometer_km,
      driver_id !== undefined ? driver_id : null,
      last_service_odometer_km, last_service_date, service_interval_km,
      status, id
    ]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Vehicle not found.' });

    const updated = result.rows[0];
    await logAudit(req.user?.id, 'vehicle.update', 'vehicle', id, updated);
    res.json(updated);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'Registration number already exists.' });
    console.error('UpdateVehicle error:', err.message);
    res.status(500).json({ message: 'Server error updating vehicle.' });
  }
};

// DELETE /api/vehicles/:id (Admin only)
const deleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING id, registration_number', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Vehicle not found.' });

    await logAudit(req.user?.id, 'vehicle.delete', 'vehicle', id, { registration_number: result.rows[0].registration_number });
    res.json({ message: `Vehicle ${result.rows[0].registration_number} deleted successfully.` });
  } catch (err) {
    console.error('DeleteVehicle error:', err.message);
    res.status(500).json({ message: 'Server error deleting vehicle.' });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  getPredictedServiceDate,
  getVehicleGeofence,
  saveVehicleGeofence,
  getLatestLocations,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
