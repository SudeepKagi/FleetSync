/**
 * sockets/index.js: Initializes Socket.io WebSocket server, verifies JWT auth handshake, and manages role rooms.
 * Called by: server.js
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : (origin, callback) => callback(null, true),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication token required for WebSocket connection'));
    }

    try {
      const secret = process.env.JWT_SECRET || 'fleetsync-fallback-secret-2024';
      const decoded = jwt.verify(token.replace(/^Bearer\s+/, ''), secret);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role, email } = socket.user;
    console.log(`🔌 [Socket.io] Connected: ${email} (${role}, user ID: ${id}) - Socket ID: ${socket.id}`);

    // Join room based on role
    if (role === 'admin' || role === 'fleet_manager') {
      socket.join('managers');
      console.log(`📡 User ${email} joined 'managers' room.`);
    } else if (role === 'driver') {
      socket.join(`driver:${id}`);
      console.log(`📡 Driver ${email} joined 'driver:${id}' room.`);
    }

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.io] Disconnected: ${email} (${socket.id})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet.');
  }
  return io;
}

module.exports = { initSocket, getIO };
