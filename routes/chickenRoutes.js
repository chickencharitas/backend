import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as chickenCtrl from '../controllers/chickenController.js';

const router = express.Router();

// BREEDS
router.get('/breeds', authenticateToken, chickenCtrl.listBreeds);

// CHICKENS
router.post('/chickens', authenticateToken, chickenCtrl.registerChicken);
router.post('/chickens/import', authenticateToken, chickenCtrl.bulkImport);
router.get('/chickens', authenticateToken, chickenCtrl.listChickens);
router.get('/chickens/:id', authenticateToken, chickenCtrl.getChicken);
router.put('/chickens/:id', authenticateToken, chickenCtrl.updateChicken);

// FLOCKS
router.post('/flocks', authenticateToken, chickenCtrl.createFlock);
router.get('/flocks', authenticateToken, chickenCtrl.listFlocks);
router.post('/flocks/:flockId/add', authenticateToken, chickenCtrl.addChickenToFlock);
router.post('/flocks/:flockId/remove', authenticateToken, chickenCtrl.removeChickenFromFlock);
router.post('/flocks/merge', authenticateToken, chickenCtrl.mergeFlocks);
router.post('/flocks/:flockId/split', authenticateToken, chickenCtrl.splitFlock);

// CULLING & MORTALITY
router.post('/chickens/:id/cull', authenticateToken, chickenCtrl.logCulling);
router.post('/chickens/:id/die', authenticateToken, chickenCtrl.logMortality);
router.get('/culling-mortality', authenticateToken, chickenCtrl.getCullingLogs);

export default router;