import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/webhookController.js';

const router = express.Router();
router.get('/', authenticateToken, ctrl.getWebhooks);
router.post('/', authenticateToken, ctrl.addWebhook);
router.put('/:id', authenticateToken, ctrl.updateWebhook);
router.delete('/:id', authenticateToken, ctrl.deleteWebhook);
export default router;