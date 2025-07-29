import { getUserById, getUserRoles as getUserRolesFromDb, assignRole, removeRole, getAllUsers } from '../models/userModel.js';

export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
};

export const assignRoleToUser = async (req, res) => {
  try {
    await assignRole(req.params.id, req.body.roleId);
    res.json({ message: 'Role assigned' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign role', details: error.message });
  }
};

export const removeRoleFromUser = async (req, res) => {
  try {
    await removeRole(req.params.id, req.body.roleId);
    res.json({ message: 'Role removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove role', details: error.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
};

export const getUserRoles = async (req, res) => {
  try {
    const roles = await getUserRolesFromDb(req.params.id);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user roles', details: error.message });
  }
};