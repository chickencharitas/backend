import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/auditController.js';
const router = express.Router();

router.get('/audit', authenticateToken, ctrl.getAuditLogs);
router.get('/security', authenticateToken, ctrl.getSecurityEvents);

// Compliance (any user can add; admin can list/update)
router.post('/compliance', authenticateToken, ctrl.addComplianceRequest);
router.get('/compliance', authenticateToken, ctrl.listComplianceRequests);
router.put('/compliance', authenticateToken, ctrl.updateComplianceRequestStatus);

export default router;