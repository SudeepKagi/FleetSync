/**
 * audit.js: Helper function to record immutable event records into the audit_log table.
 * Called by: Controllers performing mutation actions (create, update, delete).
 */

const pool = require('../config/db');

// Inserts an event record into audit_log
async function logAudit(userId, action, entityType, entityId = null, details = {}) {
  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, action, entityType, entityId, JSON.stringify(details)]
    );
  } catch (err) {
    console.error('Failed to write to audit_log:', err.message);
  }
}

module.exports = { logAudit };
