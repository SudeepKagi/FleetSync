/**
 * audit.controller.js: Returns paginated administrative audit logs for compliance tracking.
 * Called by: GET /api/audit-log (Admin only)
 */

const pool = require('../config/db');

// GET /api/audit-log (Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const { entity_type, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        al.id, al.user_id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
        u.name AS user_name, u.email AS user_email, u.role AS user_role
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
    `;

    const params = [];
    if (entity_type) {
      params.push(entity_type);
      query += ` WHERE al.entity_type = $${params.length}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const [logsRes, countRes] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) AS total FROM audit_log`),
    ]);

    res.json({
      total: Number(countRes.rows[0].total),
      logs: logsRes.rows,
    });
  } catch (err) {
    console.error('getAuditLogs error:', err.message);
    res.status(500).json({ message: 'Failed to retrieve audit log.' });
  }
};

module.exports = { getAuditLogs };
