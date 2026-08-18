/**
 * audit.routes.js: Maps endpoints for querying administrative audit logs.
 * Mounted at: /api/audit-log in app.js
 */

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/', auditController.getAuditLogs);

module.exports = router;
