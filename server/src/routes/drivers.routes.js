/**
 * drivers.routes.js: Maps endpoints for driver management and driver self-service portals.
 * Mounted at: /api/drivers in app.js
 */

const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getAllDrivers, getDriverById, createDriver, updateDriver, deleteDriver,
  getMyVehicle, getMyIssues, getMyServiceHistory,
} = require('../controllers/drivers.controller');

router.use(verifyToken);

// Self-service routes for driver role — MUST be before /:id to avoid conflict
router.get('/me/vehicle',          requireRole('driver'), getMyVehicle);
router.get('/me/issues',           requireRole('driver'), getMyIssues);
router.get('/me/service-history',  requireRole('driver'), getMyServiceHistory);

// Admin + Fleet Manager routes
router.get('/',      requireRole('admin', 'fleet_manager'), getAllDrivers);
router.post('/',     requireRole('admin', 'fleet_manager'), createDriver);
router.get('/:id',   requireRole('admin', 'fleet_manager'), getDriverById);
router.put('/:id',   requireRole('admin', 'fleet_manager'), updateDriver);
router.delete('/:id',requireRole('admin'), deleteDriver);

module.exports = router;
