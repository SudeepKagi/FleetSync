/**
 * issueHelpers.js: Query builders and Socket.io broadcast helpers for damage and incident reports.
 * Called by: issues.controller.js
 */

const { getIO } = require('../sockets');

/**
 * Builds the dynamic SQL query and parameters array for filtering issues.
 */
function buildIssuesFilterQuery({ vehicle_id, status, severity }) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (vehicle_id) {
    conditions.push(`i.vehicle_id = $${paramIndex++}`);
    params.push(vehicle_id);
  }
  if (status) {
    conditions.push(`i.status = $${paramIndex++}`);
    params.push(status);
  }
  if (severity) {
    conditions.push(`i.severity = $${paramIndex++}`);
    params.push(severity);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT i.*,
           u.name AS reporter_name,
           u.email AS reporter_email,
           v.registration_number,
           v.make,
           v.model
    FROM issues i
    LEFT JOIN users u ON i.reported_by = u.id
    JOIN vehicles v ON i.vehicle_id = v.id
    ${whereClause}
    ORDER BY
      CASE i.severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END,
      i.created_at DESC
  `;

  return { query, params };
}

/**
 * Emits real-time Socket.io notification to managers when a severe issue is logged.
 */
function notifySevereIssue(createdIssue, vehicleInfo = {}, reporterName = 'Driver') {
  try {
    const io = getIO();
    io.to('managers').emit('issue:severe-reported', {
      issue_id: createdIssue.id,
      vehicle_id: createdIssue.vehicle_id,
      registration_number: vehicleInfo.registration_number,
      make: vehicleInfo.make,
      model: vehicleInfo.model,
      title: createdIssue.title,
      severity: createdIssue.severity,
      damage_type: createdIssue.damage_type,
      reported_by_name: reporterName,
      timestamp: new Date().toISOString(),
      message: `🚨 SEVERE DAMAGE REPORTED on ${vehicleInfo.registration_number}: "${createdIssue.title}".`,
    });
  } catch (sockErr) {
    console.warn('Socket emit warning for severe issue:', sockErr.message);
  }
}

module.exports = {
  buildIssuesFilterQuery,
  notifySevereIssue,
};
