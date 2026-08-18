/**
 * issues.controller.js: Handles incident and vehicle damage reports, status updates, and statistics.
 * Called by: routes in issues.routes.js (/api/issues/*)
 */

const pool = require('../config/db');
const { logAudit } = require('../middleware/audit');
const { buildIssuesFilterQuery, notifySevereIssue } = require('../utils/issueHelpers');

// GET /api/issues (Admin + Fleet Manager, supports ?vehicle_id=, ?status=, ?severity=)
const getAllIssues = async (req, res) => {
  try {
    const { query, params } = buildIssuesFilterQuery(req.query);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('GetAllIssues error:', err.message);
    res.status(500).json({ message: 'Server error fetching issues.' });
  }
};

// GET /api/issues/:id
const getIssueById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT i.*, u.name AS reporter_name, u.email AS reporter_email,
             v.registration_number, v.make, v.model, v.status AS vehicle_status
      FROM issues i
      LEFT JOIN users u ON i.reported_by = u.id
      JOIN vehicles v ON i.vehicle_id = v.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Issue not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GetIssueById error:', err.message);
    res.status(500).json({ message: 'Server error.' });
  }
};

// POST /api/issues (Drivers and managers submit incident reports)
const createIssue = async (req, res) => {
  const { vehicle_id, damage_type, severity = 'minor', title, description, photo_url } = req.body;
  if (!vehicle_id || !title) {
    return res.status(400).json({ message: 'vehicle_id and title are required.' });
  }

  // If driver role, verify assignment to vehicle
  if (req.user.role === 'driver') {
    try {
      const driverRes = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [req.user.id]);
      if (driverRes.rows.length === 0) return res.status(403).json({ message: 'No driver profile found.' });
      const vehicleRes = await pool.query('SELECT id FROM vehicles WHERE driver_id = $1 AND id = $2', [driverRes.rows[0].id, vehicle_id]);
      if (vehicleRes.rows.length === 0) return res.status(403).json({ message: 'You can only report issues for your assigned vehicle.' });
    } catch (err) {
      return res.status(500).json({ message: 'Server error verifying vehicle assignment.' });
    }
  }

  try {
    const result = await pool.query(`
      INSERT INTO issues (vehicle_id, reported_by, damage_type, severity, title, description, photo_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [vehicle_id, req.user.id, damage_type || null, severity, title, description || null, photo_url || null]);

    const createdIssue = result.rows[0];

    // If severe issue: trigger real-time Socket.io broadcast to managers room
    if (severity === 'severe') {
      const vRes = await pool.query('SELECT registration_number, make, model FROM vehicles WHERE id = $1', [vehicle_id]);
      notifySevereIssue(createdIssue, vRes.rows[0] || {}, req.user.name);
    }

    await logAudit(req.user.id, 'issue.create', 'issue', createdIssue.id, { title, severity, damage_type, vehicle_id });
    res.status(201).json(createdIssue);
  } catch (err) {
    console.error('CreateIssue error:', err.message);
    res.status(500).json({ message: 'Server error creating issue.' });
  }
};

// PATCH /api/issues/:id (Update status and resolution)
const updateIssue = async (req, res) => {
  const { id } = req.params;
  const { status, damage_type, severity, description, photo_url } = req.body;

  try {
    const result = await pool.query(`
      UPDATE issues SET
        status      = COALESCE($1, status),
        damage_type = COALESCE($2, damage_type),
        severity    = COALESCE($3, severity),
        description = COALESCE($4, description),
        photo_url   = COALESCE($5, photo_url)
      WHERE id = $6
      RETURNING *
    `, [status, damage_type, severity, description, photo_url, id]);

    if (result.rows.length === 0) return res.status(404).json({ message: 'Issue not found.' });

    const updated = result.rows[0];
    await logAudit(req.user.id, 'issue.update', 'issue', id, updated);
    res.json(updated);
  } catch (err) {
    console.error('UpdateIssue error:', err.message);
    res.status(500).json({ message: 'Server error updating issue.' });
  }
};

// DELETE /api/issues/:id (Admin only)
const deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Issue not found.' });

    await logAudit(req.user.id, 'issue.delete', 'issue', id, {});
    res.json({ message: 'Issue deleted.' });
  } catch (err) {
    console.error('DeleteIssue error:', err.message);
    res.status(500).json({ message: 'Server error deleting issue.' });
  }
};

// GET /api/issues/stats
const getIssueStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') AS open_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        COUNT(*) FILTER (WHERE severity = 'minor' AND status != 'resolved') AS minor_open,
        COUNT(*) FILTER (WHERE severity = 'moderate' AND status != 'resolved') AS moderate_open,
        COUNT(*) FILTER (WHERE severity = 'severe' AND status != 'resolved') AS severe_open
      FROM issues
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GetIssueStats error:', err.message);
    res.status(500).json({ message: 'Server error fetching issue stats.' });
  }
};

module.exports = {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssueStats,
};
