const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const {
  connectOBS,
  connectVMix,
  connectStreamDeck,
  connectMIDI,
  connectNDI,
  connectCCLI,
  getIntegrationStatus,
  testIntegration,
  sendCommand,
  disconnectIntegration
} = require('../controllers/integrationController');

// OBS Integration
router.post('/obs/connect', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), connectOBS);
router.post('/obs/test', testIntegration);

// vMix Integration
router.post('/vmix/connect', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), connectVMix);
router.post('/vmix/test', testIntegration);

// Stream Deck Integration
router.post('/stream-deck/connect', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), connectStreamDeck);
router.post('/stream-deck/test', testIntegration);

// MIDI Integration
router.post('/midi/connect', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), connectMIDI);
router.post('/midi/test', testIntegration);

// NDI Integration
router.post('/ndi/connect', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), connectNDI);
router.post('/ndi/test', testIntegration);

// CCLI Integration
router.post('/ccli/connect', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), connectCCLI);
router.post('/ccli/test', testIntegration);

// General
router.get('/status', getIntegrationStatus);
router.post('/command', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), sendCommand);
router.post('/:type/disconnect', rbac([PERMISSIONS.MANAGE_INTEGRATIONS]), disconnectIntegration);

module.exports = router;