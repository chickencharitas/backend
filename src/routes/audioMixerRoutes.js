const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const {
  mixAudio,
  mixAudioWithEffects,
  mixMultitrack,
  audioducking,
  normalizeAudio,
  analyzeAudio,
  getMixHistory,
  deleteMix
} = require('../controllers/audioMixerController');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join('uploads', 'audio'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file format'), false);
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

const router = express.Router();

// Protect all routes with authentication
router.use(authenticate);

// ============================================================
// BASIC AUDIO MIXING
// ============================================================

/**
 * POST /api/audio-mixer/mix
 * Mix two audio files
 * Body: { volume1, volume2 }
 * Files: audio1, audio2
 */
router.post(
  '/mix',
  upload.fields([
    { name: 'audio1', maxCount: 1 },
    { name: 'audio2', maxCount: 1 }
  ]),
  mixAudio
);

// ============================================================
// ADVANCED MIXING WITH EFFECTS
// ============================================================

/**
 * POST /api/audio-mixer/mix-effects
 * Mix audio with EQ and effects (reverb, bass, treble)
 * Body: {
 *   effects: {
 *     0: { volume: 1, bass: 0, treble: 0, reverb: 0 },
 *     1: { volume: 1, bass: -2, treble: 2, reverb: 0.5 }
 *   }
 * }
 * Files: multiple audio files
 */
router.post(
  '/mix-effects',
  upload.array('audioFiles', 10),
  mixAudioWithEffects
);

// ============================================================
// MULTITRACK MIXING
// ============================================================

/**
 * POST /api/audio-mixer/multitrack
 * Mix multiple audio tracks with individual settings
 * Body: {
 *   trackSettings: {
 *     0: { volume: 1, pan: 0, delay: 0, mute: false },
 *     1: { volume: 0.8, pan: -0.5, delay: 100, mute: false }
 *   }
 * }
 * Files: multiple audio files
 */
router.post(
  '/multitrack',
  upload.array('audioFiles', 10),
  mixMultitrack
);

// ============================================================
// AUDIO DUCKING
// ============================================================

/**
 * POST /api/audio-mixer/ducking
 * Apply audio ducking (lower background when vocals detected)
 * Body: { duckingAmount: 0.3 }
 * Files: vocalTrack, backgroundTrack
 */
router.post(
  '/ducking',
  upload.fields([
    { name: 'vocalTrack', maxCount: 1 },
    { name: 'backgroundTrack', maxCount: 1 }
  ]),
  audioducking
);

// ============================================================
// NORMALIZATION
// ============================================================

/**
 * POST /api/audio-mixer/normalize
 * Normalize audio loudness to LUFS standard
 * Body: { targetLoudness: -16, method: 'lufs' }
 * Files: audioFile
 */
router.post(
  '/normalize',
  upload.single('audioFile'),
  normalizeAudio
);

// ============================================================
// AUDIO ANALYSIS
// ============================================================

/**
 * POST /api/audio-mixer/analyze
 * Get detailed audio analysis (bitrate, sample rate, channels, etc.)
 * Files: audioFile
 */
router.post(
  '/analyze',
  upload.single('audioFile'),
  analyzeAudio
);

// ============================================================
// MIX HISTORY & MANAGEMENT
// ============================================================

/**
 * GET /api/audio-mixer/history
 * Get all mixes created in organization
 */
router.get('/history', getMixHistory);

/**
 * DELETE /api/audio-mixer/:mixId
 * Delete a specific mix
 */
router.delete('/:mixId', deleteMix);

module.exports = router;