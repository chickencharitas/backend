import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import * as farmCtrl from '../controllers/farmController.js';

const router = express.Router();

// FARM
router.post('/', authenticateToken, farmCtrl.addFarm);
router.get('/', authenticateToken, farmCtrl.listFarms);
router.put('/:id', authenticateToken, farmCtrl.updateFarmInfo);
router.delete('/:id', authenticateToken, farmCtrl.removeFarm);

// FACILITY
router.post('/facilities', authenticateToken, farmCtrl.addFacility);
router.get('/facilities', authenticateToken, farmCtrl.listFacilities);
router.put('/facilities/:id', authenticateToken, farmCtrl.updateFacilityInfo);
router.delete('/facilities/:id', authenticateToken, farmCtrl.removeFacility);

// FACILITY ASSIGNMENT
router.post('/facilities/:facilityId/assign', authenticateToken, farmCtrl.assignUser);
router.post('/facilities/:facilityId/remove', authenticateToken, farmCtrl.removeUser);
router.get('/facilities/:facilityId/users', authenticateToken, farmCtrl.listFacilityUsers);

export default router;
