import { getUserById, getUserRoles as getUserRolesFromDb, assignRole, removeRole, getAllUsers } from '../models/userModel.js';

export const getProfile = async (req, res) => {
  const user = await getUserById(req.user.userId);
  res.json(user);
};

export const assignRoleToUser = async (req, res) => {
  await assignRole(req.params.id, req.body.roleId);
  res.json({ message: 'Role assigned' });
};

export const removeRoleFromUser = async (req, res) => {
  await removeRole(req.params.id, req.body.roleId);
  res.json({ message: 'Role removed' });
};

export const listUsers = async (req, res) => {
  const users = await getAllUsers();
  res.json(users);
};

export const getUserRoles = async (req, res) => {
  const roles = await getUserRolesFromDb(req.params.id);
  res.json(roles);
};