import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/healthController.js';

const router = express.Router();

router.get('/vaccines', authenticateToken, ctrl.getVaccines);
router.post('/vaccines', authenticateToken, ctrl.createVaccine);

router.get('/treatments', authenticateToken, ctrl.getTreatments);
router.post('/treatments', authenticateToken, ctrl.createTreatment);

router.post('/event', authenticateToken, ctrl.addHealthEvent);
router.get('/events', authenticateToken, ctrl.getHealthEvents);

router.post('/outbreak', authenticateToken, ctrl.addOutbreak);
router.get('/outbreaks', authenticateToken, ctrl.getOutbreaks);

router.get('/mortality-analysis', authenticateToken, ctrl.getMortalityAnalysis);

export default router;