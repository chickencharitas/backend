import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/egg-production', authenticateToken, ctrl.getEggProductionStats);
router.get('/hatch-stats', authenticateToken, ctrl.getHatchStats);
router.get('/chick-survival', authenticateToken, ctrl.getChickSurvivalStats);
router.get('/growth', authenticateToken, ctrl.getGrowthStats);
router.get('/feed-conversion', authenticateToken, ctrl.getFeedConversionStats);
router.get('/genetic-traits', authenticateToken, ctrl.getGeneticTraits);

export default router;