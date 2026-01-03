const app = require('./src/app');
const http = require('http');
const socketIO = require('socket.io');
const { initializeDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.IO namespace for real-time features
const presenter = io.of('/presenter');
const congregation = io.of('/congregation');

presenter.on('connection', (socket) => {
  console.log('Presenter connected:', socket.id);
  
  socket.on('slide_change', (data) => {
    congregation.emit('slide_change', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Presenter disconnected:', socket. id);
  });
});

congregation.on('connection', (socket) => {
  console.log('Congregation view connected:', socket.id);
});

// Store io instance in app
app.set('io', io);

// Initialize database and start server
initializeDatabase(). then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}). catch(err => {
  console.error('Database initialization failed:', err);
  process. exit(1);
});

module.exports = server;