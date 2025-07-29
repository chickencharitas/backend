import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { exportComplianceCSV, exportCompliancePDF } from '../controllers/complianceExportController.js';
const router = express.Router();

router.get('/export/csv', authenticateToken, exportComplianceCSV);
router.get('/export/pdf', authenticateToken, exportCompliancePDF);

export default router;