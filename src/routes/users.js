const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const {
  getProfile,
  updateProfile,
  getOrganizationUsers,
  addUser,
  updateUserRole,
  removeUser,
  inviteUser,
  resendInvite,
  changePassword
} = require('../controllers/userController');

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);

router.get('/', rbac([PERMISSIONS.MANAGE_USERS]), getOrganizationUsers);
router.post('/', rbac([PERMISSIONS. MANAGE_USERS]), addUser);
router.put('/:id/role', rbac([PERMISSIONS. MANAGE_ROLES]), updateUserRole);
router. delete('/:id', rbac([PERMISSIONS.MANAGE_USERS]), removeUser);
router.post('/invite', rbac([PERMISSIONS. MANAGE_USERS]), inviteUser);
router.post('/:id/resend-invite', rbac([PERMISSIONS.MANAGE_USERS]), resendInvite);

module.exports = router;