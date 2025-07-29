import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as userCtrl from '../controllers/userController.js';
const router = express.Router();

router.get('/profile', authenticateToken, userCtrl.getProfile);
router.post('/:id/roles', authenticateToken, userCtrl.assignRoleToUser);
router.delete('/:id/roles', authenticateToken, userCtrl.removeRoleFromUser);
router.get('/:id/roles', authenticateToken, userCtrl.getUserRoles); // Get all roles for a user
router.get('/', userCtrl.listUsers); // <-- This is required

export default router;