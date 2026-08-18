/**
 * service.routes.js: Maps endpoints for vehicle service records and maintenance history.
 * Mounted at: /api/service-records in app.js
 */

const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/',      serviceController.getServiceRecords);
router.get('/:id',   serviceController.getServiceRecordById);
router.post('/',     requireRole('admin', 'fleet_manager'), serviceController.createServiceRecord);
router.delete('/:id',requireRole('admin'), serviceController.deleteServiceRecord);

module.exports = router;
