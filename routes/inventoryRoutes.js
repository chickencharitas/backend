import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/inventoryController.js';

const router = express.Router();

router.post('/locations', authenticateToken, ctrl.createLocation);
router.get('/locations', authenticateToken, ctrl.getLocations);

router.get('/item-types', authenticateToken, ctrl.getItemTypes);
router.post('/item-types', authenticateToken, ctrl.createItemType);

router.get('/items', authenticateToken, ctrl.getItems);
router.post('/items', authenticateToken, ctrl.createItem);

router.get('/inventory', authenticateToken, ctrl.getInventory);
router.post('/batches', authenticateToken, ctrl.addBatch);

router.post('/stock-movement', authenticateToken, ctrl.addStockMovement);
router.get('/stock-movement', authenticateToken, ctrl.getStockMovements);

router.get('/alerts/low-stock', authenticateToken, ctrl.getLowStock);
router.get('/alerts/expiring', authenticateToken, ctrl.getExpiringSoon);

export default router;