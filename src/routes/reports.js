const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const {
  getServiceHistory,
  getMediaAnalytics,
  getUsageAnalytics,
  getAuditLog,
  generateReport,
  exportReport,
  getCCLIReport
} = require('../controllers/reportController');

router.get('/service-history', getServiceHistory);
router.get('/media-analytics', getMediaAnalytics);
router.get('/usage-analytics', getUsageAnalytics);
router.get('/audit-log', rbac([PERMISSIONS.MANAGE_SETTINGS]), getAuditLog);
router.post('/generate', rbac([PERMISSIONS.VIEW_REPORTS]), generateReport);
router.post('/export', rbac([PERMISSIONS.VIEW_REPORTS]), exportReport);
router.get('/ccli', getCCLIReport);

module. exports = router;