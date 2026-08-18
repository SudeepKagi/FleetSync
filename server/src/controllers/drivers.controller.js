/**
 * drivers.controller.js: Handles driver management, onboarding transactions, and driver self-service views.
 * Called by: routes in drivers.routes.js (/api/drivers/*)
 */

const pool = require('../config/db');
const {
  QUERY_ALL_DRIVERS,
  QUERY_DRIVER_BY_ID,
  createDriverWithUser,
} = require('../utils/driverHelpers');

// GET /api/drivers (Admin + Fleet Manager)
const getAllDrivers = async (req, res) => {
  try {
    const result = await pool.query(QUERY_ALL_DRIVERS);
    res.json(result.rows);
  } catch (err) {
    console.error('GetAllDrivers error:', err.message);
    res.status(500).json({ message: 'Server error fetching drivers.' });
  }
};

// GET /api/drivers/:id
const getDriverById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(QUERY_DRIVER_BY_ID, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Driver not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GetDriverById error:', err.message);
    res.status(500).json({ message: 'Server error fetching driver.' });
  }
};

// POST /api/drivers (Creates driver profile AND linked login user atomically)
const createDriver = async (req, res) => {
  const { name, license_number, phone, email, password } = req.body;
  if (!name || !license_number || !email || !password) {
    return res.status(400).json({ message: 'Name, license_number, email, and password are required.' });
  }

  const client = await pool.connect();
  try {
    const outcome = await createDriverWithUser(client, { name, license_number, phone, email, password });
    if (outcome.error) {
      return res.status(outcome.status || 400).json({ message: outcome.error });
    }
    res.status(201).json({
      message: 'Driver and user account created successfully.',
      driver: outcome.driver,
      login_email: outcome.email,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CreateDriver error:', err.message);
    res.status(500).json({ message: 'Server error creating driver.' });
  } finally {
    client.release();
  }
};

// PUT /api/drivers/:id
const updateDriver = async (req, res) => {
  const { id } = req.params;
  const { name, license_number, phone } = req.body;

  try {
    const result = await pool.query(`
      UPDATE drivers SET
        name           = COALESCE($1, name),
        license_number = COALESCE($2, license_number),
        phone          = COALESCE($3, phone)
      WHERE id = $4
      RETURNING *
    `, [name, license_number, phone, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Driver not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ message: 'License number already exists.' });
    console.error('UpdateDriver error:', err.message);
    res.status(500).json({ message: 'Server error updating driver.' });
  }
};

// DELETE /api/drivers/:id (Admin only)
const deleteDriver = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM drivers WHERE id = $1 RETURNING id, name', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Driver not found.' });
    res.json({ message: `Driver ${result.rows[0].name} deleted successfully.` });
  } catch (err) {
    console.error('DeleteDriver error:', err.message);
    res.status(500).json({ message: 'Server error deleting driver.' });
  }
};

// ─── Driver Self-Service Handlers ─────────────────────────────────────────────

// GET /api/drivers/me/vehicle (Returns logged-in driver's assigned vehicle)
const getMyVehicle = async (req, res) => {
  try {
    const driverRes = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [req.user.id]);
    if (driverRes.rows.length === 0) {
      return res.status(404).json({ message: 'No driver profile found for this account.' });
    }

    const vehicleRes = await pool.query(`
      SELECT v.*,
             (v.current_odometer_km - v.last_service_odometer_km) AS km_since_service,
             (SELECT COUNT(*) FROM maintenance_alerts WHERE vehicle_id = v.id AND is_resolved = FALSE) AS active_alerts
      FROM vehicles v
      WHERE v.driver_id = $1
    `, [driverRes.rows[0].id]);

    if (vehicleRes.rows.length === 0) {
      return res.status(404).json({ message: 'No vehicle assigned to you.' });
    }
    res.json(vehicleRes.rows[0]);
  } catch (err) {
    console.error('GetMyVehicle error:', err.message);
    res.status(500).json({ message: 'Server error fetching your vehicle.' });
  }
};

// GET /api/drivers/me/issues (Returns issues reported by logged-in driver)
const getMyIssues = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, v.registration_number AS vehicle_registration, v.make, v.model
      FROM issues i
      JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.reported_by = $1
      ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('GetMyIssues error:', err.message);
    res.status(500).json({ message: 'Server error fetching your issues.' });
  }
};

// GET /api/drivers/me/service-history
const getMyServiceHistory = async (req, res) => {
  try {
    const driverRes = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [req.user.id]);
    if (driverRes.rows.length === 0) return res.status(404).json({ message: 'No driver profile found.' });

    const vehicleRes = await pool.query('SELECT id FROM vehicles WHERE driver_id = $1', [driverRes.rows[0].id]);
    if (vehicleRes.rows.length === 0) return res.json([]);

    const records = await pool.query(
      `SELECT * FROM service_records WHERE vehicle_id = $1 ORDER BY service_date DESC`,
      [vehicleRes.rows[0].id]
    );
    res.json(records.rows);
  } catch (err) {
    console.error('GetMyServiceHistory error:', err.message);
    res.status(500).json({ message: 'Server error fetching service history.' });
  }
};

module.exports = {
  getAllDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getMyVehicle,
  getMyIssues,
  getMyServiceHistory,
};
