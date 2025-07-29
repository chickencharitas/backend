import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as ctrl from '../controllers/taskCalendarController.js';

const router = express.Router();

router.get('/tasks', authenticateToken, ctrl.getTasks);
router.post('/tasks', authenticateToken, ctrl.addTask);
router.put('/tasks/status', authenticateToken, ctrl.updateTaskStatus);

router.get('/calendar', authenticateToken, ctrl.getEvents);
router.post('/calendar', authenticateToken, ctrl.addEvent);

router.get('/alerts', authenticateToken, ctrl.getAlerts);
router.put('/alerts/read', authenticateToken, ctrl.markAlertRead);

router.get('/reminders', authenticateToken, ctrl.getReminders);
router.post('/reminders', authenticateToken, ctrl.addReminder);

export default router;