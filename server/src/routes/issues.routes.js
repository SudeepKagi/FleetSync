/**
 * issues.routes.js: Maps endpoints for logging damage reports, incident triage, and issue stats.
 * Mounted at: /api/issues in app.js
 */

const express = require('express');
const router = express.Router();
const issuesController = require('../controllers/issues.controller');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/stats', issuesController.getIssueStats);
router.get('/',      issuesController.getAllIssues);
router.post('/',     issuesController.createIssue);
router.get('/:id',   issuesController.getIssueById);
router.patch('/:id', requireRole('admin', 'fleet_manager'), issuesController.updateIssue);
router.delete('/:id',requireRole('admin'), issuesController.deleteIssue);

module.exports = router;
