/**
 * 🚀 ShashaStream / Woshipress Server
 * - Express API
 * - Socket.IO (Presenter + Congregation)
 * - Render + Localhost CORS safe
 */

require('dotenv').config();

const http = require('http');
const socketIO = require('socket.io');
const app = require('./src/app');
const { initializeDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 5000;

/* ----------------------------------
   HTTP SERVER
----------------------------------- */
const server = http.createServer(app);

/* ----------------------------------
   CORS CONFIG (Render + Local)
----------------------------------- */
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://frontend-v1fb.onrender.com',
];

// Socket.IO instance
const io = socketIO(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow server-to-server & health checks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked: ${origin}`), false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

/* ----------------------------------
   SOCKET.IO NAMESPACES
----------------------------------- */
const presenter = io.of('/presenter');
const congregation = io.of('/congregation');

/* ----------------------------------
   PRESENTER NAMESPACE
----------------------------------- */
presenter.on('connection', (socket) => {
  console.log('🎤 Presenter connected:', socket.id);

  /**
   * Join a service room
   * payload: { serviceId }
   */
  socket.on('join_service', ({ serviceId }) => {
    if (!serviceId) return;
    socket.join(serviceId);
    console.log(`Presenter joined service ${serviceId}`);
  });

  /**
   * Slide change broadcast
   * payload: { serviceId, slide }
   */
  socket.on('slide_change', (data) => {
    const { serviceId } = data;
    if (!serviceId) return;

    // Broadcast ONLY to that service room
    congregation.to(serviceId).emit('slide_change', data);
  });

  socket.on('disconnect', () => {
    console.log('🎤 Presenter disconnected:', socket.id);
  });
});

/* ----------------------------------
   CONGREGATION NAMESPACE
----------------------------------- */
congregation.on('connection', (socket) => {
  console.log('👥 Congregation connected:', socket.id);

  /**
   * Join service room
   * payload: { serviceId }
   */
  socket.on('join_service', ({ serviceId }) => {
    if (!serviceId) return;
    socket.join(serviceId);
    console.log(`Congregation joined service ${serviceId}`);
  });

  socket.on('disconnect', () => {
    console.log('👥 Congregation disconnected:', socket.id);
  });
});

/* ----------------------------------
   MAKE IO AVAILABLE TO EXPRESS
----------------------------------- */
app.set('io', io);

/* ----------------------------------
   START SERVER
----------------------------------- */
initializeDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  });

module.exports = server;
