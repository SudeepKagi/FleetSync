/**
 * server.js: Entry point that starts the HTTP server, initializes Socket.io, schedules cron jobs, and runs the GPS simulator.
 * Called by: `npm start` / `npm run dev`
 */

require('dotenv').config();
const http = require('http');
const cron = require('node-cron');
const app = require('./app');
const pool = require('./config/db');
const { initSocket } = require('./sockets');
const { startLocationSimulator, stopLocationSimulator } = require('./sockets/locationSimulator');

const PORT = process.env.PORT || 3000;

// ─── Create HTTP Server & Attach Socket.io ────────────────────────────────────
const httpServer = http.createServer(app);
initSocket(httpServer);

// ─── Start Server ─────────────────────────────────────────────────────────────
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 FleetSync API + Socket.io running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start GPS Simulation for live fleet map
  startLocationSimulator();
});

// ─── Cron Job: Run maintenance check every hour ───────────────────────────────
cron.schedule('0 * * * *', async () => {
  console.log(`[CRON] Running check_maintenance_due() at ${new Date().toISOString()}`);
  try {
    const result = await pool.query('SELECT check_maintenance_due() AS result');
    console.log(`[CRON] ${result.rows[0].result}`);
  } catch (err) {
    console.error('[CRON] Maintenance check failed:', err.message);
  }
}, {
  timezone: 'UTC',
});

console.log('⏰ Maintenance check cron job scheduled (runs every hour)');

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully...');
  stopLocationSimulator();
  server.close(() => {
    pool.end(() => {
      console.log('Database pool closed.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received — shutting down...');
  stopLocationSimulator();
  server.close(() => {
    pool.end(() => {
      process.exit(0);
    });
  });
});

module.exports = server;
