import express from 'express';
import * as roleCtrl from '../controllers/roleController.js';
const router = express.Router();

router.get('/', roleCtrl.listRoles);
router.post('/', roleCtrl.createRoleCtrl);
router.put('/:id', roleCtrl.updateRoleCtrl); // <-- Add update route
router.delete('/:id', roleCtrl.deleteRoleCtrl);

router.post('/:id/permissions', roleCtrl.assignPermissionCtrl);
router.delete('/:id/permissions', roleCtrl.removePermissionCtrl);
router.get('/:id/permissions', roleCtrl.getRolePermissionsCtrl);
router.get('/permissions-matrix', roleCtrl.getPermissionsMatrix); // <-- Add this line
export default router;