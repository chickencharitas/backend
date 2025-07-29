import express from 'express';
import * as permCtrl from '../controllers/permissionController.js';
const router = express.Router();

router.get('/', permCtrl.listPermissions);
router.post('/', permCtrl.createPermissionCtrl);
router.put('/:id', permCtrl.updatePermissionCtrl); // <-- Add update route
router.delete('/:id', permCtrl.deletePermissionCtrl);

export default router;