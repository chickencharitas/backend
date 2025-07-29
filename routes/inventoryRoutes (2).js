import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/inventoryController.js';

const router = express.Router();

router.get('/consumables', authenticateToken, ctrl.getConsumables);
router.post('/consumables', authenticateToken, ctrl.addConsumable);
router.put('/consumables/stock', authenticateToken, ctrl.updateConsumableStock);

router.get('/equipment', authenticateToken, ctrl.getEquipment);
router.post('/equipment', authenticateToken, ctrl.addEquipment);
router.put('/equipment/status', authenticateToken, ctrl.updateEquipmentStatus);

export default router;