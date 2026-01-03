const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/streamingController');

const router = express.Router();
router.use(authenticate);

/* ========================
   STREAM COLLECTION
======================== */
router.post('/create', controller.createLiveStream);
router.get('/list', controller.getStreams);
router.post('/start', controller.startStream);
router.post('/end', controller.endStream);

/* ========================
   PLATFORMS
======================== */
router.get('/platforms', controller.getPlatforms);
router.post('/platform/add', controller.addPlatform);
router.delete('/platform/:platform_id', controller.removePlatform);

/* ========================
   RECORDINGS (static first)
======================== */
router.get('/recordings', controller.getRecordings);
router.post('/recording/create', controller.createRecording);
router.post('/recording/status', controller.updateRecordingStatus);
router.post('/recording/publish', controller.publishRecording);
router.delete('/recording/:recording_id', controller.deleteRecording);
router.get('/recording/:recording_id/formats', controller.getRecordingFormats);

/* ========================
   CDN
======================== */
router.get('/cdn/providers', controller.getCDNProviders);
router.post('/cdn/provider/add', controller.addCDNProvider);
router.put('/cdn/provider/:provider_id', controller.updateCDNProvider);
router.delete('/cdn/provider/:provider_id', controller.deleteCDNProvider);

/* ========================
   SETTINGS / PRESETS / WEBHOOKS
======================== */
router.get('/settings', controller.getStreamSettings);
router.put('/settings', controller.updateStreamSettings);

router.get('/presets', controller.getPresets);
router.post('/preset/add', controller.addPreset);
router.delete('/preset/:preset_id', controller.deletePreset);

router.get('/webhooks', controller.getWebhooks);
router.post('/webhook/add', controller.addWebhook);
router.delete('/webhook/:webhook_id', controller.deleteWebhook);

/* ========================
   STREAM-SCOPED (dynamic LAST)
======================== */
router.get('/:stream_id', controller.getStreamById);
router.put('/:stream_id', controller.updateStream);
router.delete('/:stream_id', controller.deleteStream);

router.get('/:stream_id/broadcasts', controller.getBroadcasts);
router.get('/:stream_id/chat', controller.getChatMessages);
router.get('/:stream_id/analytics', controller.getAnalytics);
router.get('/:stream_id/timeline', controller.getViewerTimeline);
router.get('/:stream_id/recordings', controller.getRecordingsByStream);

module.exports = router;
