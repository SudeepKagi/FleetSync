/**
 * alerts.routes.js: Maps endpoints for maintenance alerts and resolution status.
 * Mounted at: /api/alerts in app.js
 */

const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireRole('admin', 'fleet_manager'));

router.get('/', alertsController.getAlerts);
router.get('/stats', alertsController.getAlertStats);
router.patch('/:id/resolve', alertsController.resolveAlert);

module.exports = router;
