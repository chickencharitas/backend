const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Middleware imports
const { authenticate, verifyOrganization } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const presentationRoutes = require('./routes/presentations');
const playlistRoutes = require('./routes/playlists');
const mediaRoutes = require('./routes/media');
const scriptureRoutes = require('./routes/scripture');
const bibleRoutes = require('./routes/bibleRoutes');
const settingsRoutes = require('./routes/settings');
const integrationRoutes = require('./routes/integrations');
const reportRoutes = require('./routes/reports');
const approvalRoutes = require('./routes/approvalRoutes');
const audioMixerRoutes = require('./routes/audioMixerRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const collaborativeRoutes = require('./routes/collaborativeRoutes');
const commentsRoutes = require('./routes/commentsRoutes');
const imageEditorRoutes = require('./routes/imageEditorRoutes');
const streamingRoutes = require('./routes/streamingRoutes');
const versionRoutes = require('./routes/versionRoutes');
const videoEditorRoutes = require('./routes/videoEditorRoutes');
const watermarkRoutes = require('./routes/watermarkRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');
const captionRoutes = require('./routes/captionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

dotenv.config();

const app = express();

// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/bible', bibleRoutes); // Bible API - public access

// ============================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================

app.use('/api/users', authenticate, userRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);

// ============================================================
// ORGANIZATION-SCOPED ROUTES (Auth + Org verification required)
// ============================================================

app.use('/api/presentations', authenticate, verifyOrganization, presentationRoutes);
app.use('/api/playlists', authenticate, verifyOrganization, playlistRoutes);
app.use('/api/media', authenticate, verifyOrganization, mediaRoutes);
app.use('/api/scripture', authenticate, verifyOrganization, scriptureRoutes);
app.use('/api/settings', authenticate, verifyOrganization, settingsRoutes);
app.use('/api/integrations', authenticate, verifyOrganization, integrationRoutes);
app.use('/api/reports', authenticate, verifyOrganization, reportRoutes);
app.use('/api/approvals', authenticate, verifyOrganization, approvalRoutes);
app.use('/api/audio-mixer', authenticate, verifyOrganization, audioMixerRoutes);
app.use('/api/calendar', authenticate, verifyOrganization, calendarRoutes);
app.use('/api/collaborative', authenticate, verifyOrganization, collaborativeRoutes);
app.use('/api/comments', authenticate, verifyOrganization, commentsRoutes);
app.use('/api/image-editor', authenticate, verifyOrganization, imageEditorRoutes);
app.use('/api/streaming', authenticate, verifyOrganization, streamingRoutes);
app.use('/api/video-editor', authenticate, verifyOrganization, videoEditorRoutes);
app.use('/api/watermark', authenticate, verifyOrganization, watermarkRoutes);
app.use('/api/devices', authenticate, verifyOrganization, deviceRoutes);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ============================================================
// ERROR HANDLING (Must be last)
// ============================================================

app.use(errorHandler);

module.exports = app;