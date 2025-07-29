import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/alertRuleController.js';

const router = express.Router();

router.get('/rules', authenticateToken, ctrl.getAlertRules);
router.post('/rules', authenticateToken, ctrl.addAlertRule);
router.put('/rules', authenticateToken, ctrl.updateAlertRule);
router.delete('/rules', authenticateToken, ctrl.deleteAlertRule);

router.get('/logs', authenticateToken, ctrl.getNotificationLogs);

export default router;