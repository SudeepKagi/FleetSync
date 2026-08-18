/**
 * vehicles.routes.js: Maps endpoints for vehicle management, GPS locations, geofencing, and PDF exports.
 * Mounted at: /api/vehicles in app.js
 */

const express = require('express');
const router = express.Router();
const vehiclesController = require('../controllers/vehicles.controller');
const reportsController = require('../controllers/reports.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Location endpoints
router.get('/locations/latest', requireRole('admin', 'fleet_manager'), vehiclesController.getLatestLocations);

// Vehicle CRUD
router.get('/', requireRole('admin', 'fleet_manager'), vehiclesController.getAllVehicles);
router.get('/:id', vehiclesController.getVehicleById);
router.post('/', requireRole('admin', 'fleet_manager'), vehiclesController.createVehicle);
router.put('/:id', requireRole('admin', 'fleet_manager'), vehiclesController.updateVehicle);
router.delete('/:id', requireRole('admin'), vehiclesController.deleteVehicle);

// Predictive Maintenance & Geofence
router.get('/:id/predicted-service-date', vehiclesController.getPredictedServiceDate);
router.get('/:id/geofence', requireRole('admin', 'fleet_manager'), vehiclesController.getVehicleGeofence);
router.post('/:id/geofence', requireRole('admin', 'fleet_manager'), vehiclesController.saveVehicleGeofence);

// PDF Report
router.get('/:id/report/pdf', reportsController.generateVehiclePdfReport);

module.exports = router;
