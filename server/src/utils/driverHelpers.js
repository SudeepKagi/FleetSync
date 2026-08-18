/**
 * driverHelpers.js: Database queries and transaction helpers for driver user registration.
 * Called by: drivers.controller.js
 */

const bcrypt = require('bcryptjs');

// SQL query returning all drivers with linked user email and assigned vehicle
const QUERY_ALL_DRIVERS = `
  SELECT d.*,
         u.email AS user_email,
         v.registration_number AS vehicle_registration,
         v.id AS vehicle_id,
         v.make AS vehicle_make,
         v.model AS vehicle_model
  FROM drivers d
  LEFT JOIN users u ON d.user_id = u.id
  LEFT JOIN vehicles v ON v.driver_id = d.id
  ORDER BY d.created_at DESC
`;

// SQL query returning single driver with assigned vehicle details
const QUERY_DRIVER_BY_ID = `
  SELECT d.*,
         u.email AS user_email,
         v.registration_number AS vehicle_registration,
         v.id AS vehicle_id,
         v.make AS vehicle_make,
         v.model AS vehicle_model,
         v.status AS vehicle_status
  FROM drivers d
  LEFT JOIN users u ON d.user_id = u.id
  LEFT JOIN vehicles v ON v.driver_id = d.id
  WHERE d.id = $1
`;

/**
 * Creates user account + driver profile in a single atomic database transaction.
 */
async function createDriverWithUser(client, { name, license_number, phone, email, password }) {
  await client.query('BEGIN');

  // Check email uniqueness
  const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    await client.query('ROLLBACK');
    return { error: 'Email already registered.', status: 409 };
  }

  // Check license uniqueness
  const existingDriver = await client.query('SELECT id FROM drivers WHERE license_number = $1', [license_number]);
  if (existingDriver.rows.length > 0) {
    await client.query('ROLLBACK');
    return { error: 'License number already registered.', status: 409 };
  }

  // Create user account with hashed password
  const passwordHash = await bcrypt.hash(password, 10);
  const userRes = await client.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'driver') RETURNING id`,
    [name, email, passwordHash]
  );
  const userId = userRes.rows[0].id;

  // Create driver profile linked to user account
  const driverRes = await client.query(
    `INSERT INTO drivers (user_id, name, license_number, phone) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, name, license_number, phone || null]
  );

  await client.query('COMMIT');
  return { driver: driverRes.rows[0], email };
}

module.exports = {
  QUERY_ALL_DRIVERS,
  QUERY_DRIVER_BY_ID,
  createDriverWithUser,
};
