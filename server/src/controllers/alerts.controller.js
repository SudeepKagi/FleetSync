/**
 * alerts.controller.js: Handles maintenance alerts, resolution toggling, and triggering the PL/pgSQL procedure.
 * Called by: routes in alerts.routes.js (/api/alerts/*) and POST /api/maintenance/check
 */

const pool = require('../config/db');

// GET /api/alerts (Supports ?resolved=true to include resolved ones)
const getAlerts = async (req, res) => {
  const { resolved } = req.query;
  const showResolved = resolved === 'true';

  try {
    const result = await pool.query(`
      SELECT ma.*,
             v.registration_number,
             v.make,
             v.model,
             v.status AS vehicle_status
      FROM maintenance_alerts ma
      JOIN vehicles v ON ma.vehicle_id = v.id
      ${showResolved ? '' : 'WHERE ma.is_resolved = FALSE'}
      ORDER BY ma.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('GetAlerts error:', err.message);
    res.status(500).json({ message: 'Server error fetching alerts.' });
  }
};

// PATCH /api/alerts/:id/resolve
const resolveAlert = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE maintenance_alerts SET is_resolved = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Alert not found.' });
    res.json({ message: 'Alert resolved.', alert: result.rows[0] });
  } catch (err) {
    console.error('ResolveAlert error:', err.message);
    res.status(500).json({ message: 'Server error resolving alert.' });
  }
};

// POST /api/maintenance/check (Triggers PL/pgSQL stored procedure check_maintenance_due())
const triggerMaintenanceCheck = async (req, res) => {
  try {
    const result = await pool.query('SELECT check_maintenance_due() AS result');
    res.json({ message: result.rows[0].result, triggered_at: new Date().toISOString() });
  } catch (err) {
    console.error('TriggerMaintenanceCheck error:', err.message);
    res.status(500).json({ message: 'Error running maintenance check procedure.' });
  }
};

// GET /api/alerts/stats
const getAlertStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE is_resolved = FALSE) AS open_alerts,
        COUNT(*) FILTER (WHERE is_resolved = TRUE) AS resolved_alerts,
        COUNT(*) AS total_alerts
      FROM maintenance_alerts
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GetAlertStats error:', err.message);
    res.status(500).json({ message: 'Server error fetching alert stats.' });
  }
};

module.exports = { getAlerts, resolveAlert, triggerMaintenanceCheck, getAlertStats };
