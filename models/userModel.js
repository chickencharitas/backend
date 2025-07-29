import db from '../config/db.js';

export const createUser = async ({ name, email, phone, passwordHash }) => {
  const res = await db.query(
    'INSERT INTO users (name, email, phone, password_hash) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, email, phone, passwordHash]);
  return res.rows[0];
};
export const getUserByEmail = async (email) => {
  const res = await db.query('SELECT * FROM users WHERE email=$1', [email]);
  return res.rows[0];
};
export const getUserById = async (id) => {
  const res = await db.query('SELECT * FROM users WHERE id=$1', [id]);
  return res.rows[0];
};
export const assignRole = async (userId, roleId) => {
  await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, roleId]);
};

export const removeRole = async (userId, roleId) => {
  await db.query('DELETE FROM user_roles WHERE user_id=$1 AND role_id=$2', [userId, roleId]);
};

export const getUserRoles = async (userId) => {
  const res = await db.query(
    'SELECT r.* FROM roles r JOIN user_roles ur ON ur.role_id=r.id WHERE ur.user_id=$1', [userId]);
  return res.rows;
};
export const setPhoneVerified = async (userId, verified=true) => {
  await db.query('UPDATE users SET phone_verified=$1 WHERE id=$2', [verified, userId]);
};
export const updatePassword = async (userId, passwordHash) => {
  await db.query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, userId]);
};
export const getAllUsers = async () => {
  const res = await db.query('SELECT * FROM users ORDER BY id');
  return res.rows;
};