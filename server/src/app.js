/**
 * app.js: Configures Express middleware, security headers, rate limiting, and mounts API route modules.
 * Called by: server.js
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Route imports
const authRoutes        = require('./routes/auth.routes');
const vehiclesRoutes    = require('./routes/vehicles.routes');
const driversRoutes     = require('./routes/drivers.routes');
const serviceRoutes     = require('./routes/service.routes');
const alertsRoutes      = require('./routes/alerts.routes');
const issuesRoutes      = require('./routes/issues.routes');
const reportsRoutes     = require('./routes/reports.routes');
const auditRoutes       = require('./routes/audit.routes');

// Maintenance controller for the /api/maintenance/check endpoint
const { triggerMaintenanceCheck } = require('./controllers/alerts.controller');
const { verifyToken, requireRole } = require('./middleware/auth');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ─── Security Headers (helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
}));

// ─── Response Compression ─────────────────────────────────────────────────────
app.use(compression());

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : true;

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 200 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again in 15 minutes.' },
  skip: (req) => req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 100,
  message: { message: 'Too many login attempts. Please wait 15 minutes before trying again.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// ─── Body Parsers (10mb for photo uploads) ────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Route Handlers ───────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/vehicles',       vehiclesRoutes);
app.use('/api/drivers',        driversRoutes);
app.use('/api/service-records',serviceRoutes);
app.use('/api/alerts',         alertsRoutes);
app.use('/api/issues',         issuesRoutes);
app.use('/api/reports',        reportsRoutes);
app.use('/api/audit-log',      auditRoutes);

// Maintenance check — manual trigger by fleet manager / admin
app.post(
  '/api/maintenance/check',
  verifyToken,
  requireRole('admin', 'fleet_manager'),
  triggerMaintenanceCheck
);

// Dashboard stats aggregate endpoint
app.get('/api/dashboard/stats', verifyToken, requireRole('admin', 'fleet_manager'), async (req, res) => {
  const pool = require('./config/db');
  try {
    const [vehicleStats, issueStats, alertStats, driverStats] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
          SUM(CASE WHEN status = 'in_service' THEN 1 ELSE 0 END) AS in_service,
          SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) AS retired
        FROM vehicles
      `),
      pool.query(`
        SELECT
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
          SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
          SUM(CASE WHEN severity = 'minor' AND status != 'resolved' THEN 1 ELSE 0 END) AS minor_open,
          SUM(CASE WHEN severity = 'moderate' AND status != 'resolved' THEN 1 ELSE 0 END) AS moderate_open,
          SUM(CASE WHEN severity = 'severe' AND status != 'resolved' THEN 1 ELSE 0 END) AS severe_open
        FROM issues
      `),
      pool.query(`SELECT COUNT(*) AS open_alerts FROM maintenance_alerts WHERE is_resolved = FALSE`),
      pool.query(`SELECT COUNT(*) AS total_drivers FROM drivers`),
    ]);

    res.json({
      vehicles: vehicleStats.rows[0],
      issues: issueStats.rows[0],
      alerts: { open_alerts: alertStats.rows[0].open_alerts },
      drivers: { total_drivers: driverStats.rows[0].total_drivers },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err.message);
    res.status(500).json({ message: 'Error fetching dashboard stats.' });
  }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FleetSync API',
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'postgresql' : 'pg-mem (demo)',
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (!isProd) {
    console.error('Unhandled error:', err.stack);
  } else {
    console.error('Unhandled error:', err.message);
  }
  res.status(err.status || 500).json({ message: isProd ? 'Internal server error.' : err.message });
});

module.exports = app;
