import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/financeController.js';

const router = express.Router();

router.post('/partners', authenticateToken, ctrl.createPartner);
router.get('/partners', authenticateToken, ctrl.getPartners);

router.post('/sale-orders', authenticateToken, ctrl.createSaleOrder);
router.post('/purchase-orders', authenticateToken, ctrl.createPurchaseOrder);
router.get('/sale-orders', authenticateToken, ctrl.getSaleOrders);
router.get('/purchase-orders', authenticateToken, ctrl.getPurchaseOrders);

router.post('/sale-orders/:orderId/items', authenticateToken, ctrl.addSaleOrderItem);
router.post('/purchase-orders/:orderId/items', authenticateToken, ctrl.addPurchaseOrderItem);
router.get('/sale-orders/:orderId/items', authenticateToken, ctrl.getSaleOrderItems);
router.get('/purchase-orders/:orderId/items', authenticateToken, ctrl.getPurchaseOrderItems);

router.post('/payments', authenticateToken, ctrl.addPayment);
router.get('/payments', authenticateToken, ctrl.getPayments);
router.get('/order-paid', authenticateToken, ctrl.getOrderPaid);

export default router;