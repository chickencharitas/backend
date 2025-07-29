import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/feedingController.js';

const router = express.Router();

router.get('/feed-batches', authenticateToken, ctrl.getFeedBatches);
router.post('/feed-batches', authenticateToken, ctrl.addFeedBatch);

router.get('/feedings', authenticateToken, ctrl.getFeedings);
router.post('/feedings', authenticateToken, ctrl.addFeeding);

router.get('/feeding-schedules', authenticateToken, ctrl.getFeedingSchedules);
router.post('/feeding-schedules', authenticateToken, ctrl.addFeedingSchedule);

export default router;