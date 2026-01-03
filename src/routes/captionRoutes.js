const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  startTranscription,
  getTranscription,
  getCaptions,
  detectLyrics,
  getLyricsSuggestions,
  approveLyrics,
  analyzeImages,
  getImageAnalysis,
  generateCuepoints,
  getCuepoints,
  updateCuepoint,
  deleteCuepoint
} = require('../controllers/captionController');

const router = express.Router();

router.use(authenticate);

// Transcription routes
router.post('/media/:mediaId/transcribe', startTranscription);
router.get('/transcriptions/:transcriptionId', getTranscription);
router.get('/transcriptions/:transcriptionId/captions', getCaptions);

// Lyrics detection
router.post('/media/:mediaId/detect-lyrics', detectLyrics);
router.get('/media/:mediaId/lyrics-suggestions', getLyricsSuggestions);
router.post('/lyrics/:lyricId/approve', approveLyrics);

// Image recognition
router.post('/media/:mediaId/analyze-images', analyzeImages);
router.get('/media/:mediaId/image-analysis', getImageAnalysis);

// Smart cue points
router.post('/media/:mediaId/generate-cuepoints', generateCuepoints);
router.get('/media/:mediaId/cuepoints', getCuepoints);
router.put('/cuepoints/:cuepointId', updateCuepoint);
router.delete('/cuepoints/:cuepointId', deleteCuepoint);

module.exports = router;