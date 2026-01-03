const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getSettings,
  updateSettings,
  getOrganizationSettings,
  updateOrganizationSettings,
  getDisplaySettings,
  updateDisplaySettings,
  getSubscriptionSettings,
  updateSubscriptionSettings,
  getIntegrationSettings,
  updateIntegrationSettings
} = require('../controllers/settingsController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// User settings
router.get('/user', getSettings);
router.put('/user', updateSettings);

// Organization settings
router.get('/organization', getOrganizationSettings);
router.put('/organization', updateOrganizationSettings);

// Display settings
router.get('/display', getDisplaySettings);
router.put('/display', updateDisplaySettings);

// Subscription settings
router.get('/subscription', getSubscriptionSettings);
router.put('/subscription', updateSubscriptionSettings);

// Integration settings
router.get('/integrations', getIntegrationSettings);
router.put('/integrations', updateIntegrationSettings);

module.exports = router;

