/**
 * service.controller.js: Handles maintenance logs, costs, and updates vehicle last-serviced odometer.
 * Called by: routes in service.routes.js (/api/service-records/*)
 */

const pool = require('../config/db');

// GET /api/service-records?vehicle_id=
const getServiceRecords = async (req, res) => {
  const { vehicle_id } = req.query;
  try {
    let query = `
      SELECT sr.*, v.registration_number, v.make, v.model
      FROM service_records sr
      JOIN vehicles v ON sr.vehicle_id = v.id
    `;
    const params = [];
    if (vehicle_id) {
      query += ' WHERE sr.vehicle_id = $1';
      params.push(vehicle_id);
    }
    query += ' ORDER BY sr.service_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GetServiceRecords error:', err.message);
    res.status(500).json({ message: 'Server error fetching service records.' });
  }
};

// GET /api/service-records/:id
const getServiceRecordById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT sr.*, v.registration_number, v.make, v.model
       FROM service_records sr
       JOIN vehicles v ON sr.vehicle_id = v.id
       WHERE sr.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Service record not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GetServiceRecordById error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/service-records (Creates service record and updates vehicle last service mileage atomically)
const createServiceRecord = async (req, res) => {
  const { vehicle_id, service_date, odometer_km, description, cost } = req.body;
  if (!vehicle_id || !service_date || !odometer_km) {
    return res.status(400).json({ message: 'vehicle_id, service_date, and odometer_km are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const recordRes = await client.query(
      `INSERT INTO service_records (vehicle_id, service_date, odometer_km, description, cost)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [vehicle_id, service_date, odometer_km, description || null, cost || null]
    );

    await client.query(
      `UPDATE vehicles SET last_service_date = $1, last_service_odometer_km = $2 WHERE id = $3`,
      [service_date, odometer_km, vehicle_id]
    );

    await client.query('COMMIT');
    res.status(201).json(recordRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CreateServiceRecord error:', err.message);
    res.status(500).json({ message: 'Server error creating service record.' });
  } finally {
    client.release();
  }
};

// DELETE /api/service-records/:id (Admin only)
const deleteServiceRecord = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM service_records WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Service record not found.' });
    res.json({ message: 'Service record deleted.' });
  } catch (err) {
    console.error('DeleteServiceRecord error:', err.message);
    res.status(500).json({ message: 'Server error deleting service record.' });
  }
};

module.exports = { getServiceRecords, getServiceRecordById, createServiceRecord, deleteServiceRecord };
