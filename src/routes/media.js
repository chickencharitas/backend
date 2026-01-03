const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const {
  uploadMedia,
  getMedia,
  getMediaLibrary,
  updateMedia,
  deleteMedia,
  searchMedia,
  generateThumbnail,
  getMediaStats
} = require('../controllers/mediaController');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = 'uploads/media';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Routes
router.post(
  '/upload',
  authenticate,
  authorize(PERMISSIONS.UPLOAD_MEDIA),
  upload.single('file'),
  uploadMedia
);

router.get('/', authenticate, getMediaLibrary);

router.get('/search/:query', authenticate, searchMedia);

router.get('/:id', authenticate, getMedia);

router.get('/:id/stats', authenticate, getMediaStats);

router.put(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.EDIT_MEDIA),
  updateMedia
);

router.delete(
  '/:id',
  authenticate,
  authorize(PERMISSIONS.DELETE_MEDIA),
  deleteMedia
);

router.post(
  '/:id/thumbnail',
  authenticate,
  authorize(PERMISSIONS.EDIT_MEDIA),
  generateThumbnail
);

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 500MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files' });
    }
  }

  if (err && err.message && err.message.includes('not allowed')) {
    return res.status(400).json({ error: err.message });
  }

  next(err);
});

module.exports = router;