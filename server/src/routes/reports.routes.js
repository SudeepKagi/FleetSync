/**
 * reports.routes.js: Maps endpoints for vehicle PDF service and incident reports.
 * Mounted at: /api/reports in app.js
 */

const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/vehicles/:id/pdf', verifyToken, reportsController.generateVehiclePdfReport);

module.exports = router;
