const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, role, organization_id, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, profileImage } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           profile_image = COALESCE($3, profile_image),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, first_name, last_name, role, organization_id`,
      [firstName, lastName, profileImage, req.user.userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (! currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const userResult = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res. status(404).json({ error: 'User not found' });
    }

    const passwordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password);

    if (!passwordValid) {
      return res. status(401).json({ error: 'Current password incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, req.user. userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

const getOrganizationUsers = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, role } = req.query;
    let query = 'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE organization_id = $1';
    const params = [req.user.organizationId];

    if (role) {
      query += ` AND role = $${params. length + 1}`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit);
    params.push(offset);

    const result = await pool. query(query, params);

    res.json({
      data: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
};

const addUser = async (req, res, next) => {
  try {
    const { email, firstName, lastName, role } = req.body;
    const userId = uuidv4();

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Generate temp password
    const tempPassword = uuidv4(). substring(0, 12);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, organization_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, email, first_name, last_name, role`,
      [userId, email, hashedPassword, firstName, lastName, role, req.user.organizationId]
    );

    // In production, send invitation email with temp password
    res.status(201).json({
      ... result.rows[0],
      message: 'User created.  Invitation sent to email.'
    });
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role required' });
    }

    const result = await pool.query(
      `UPDATE users 
       SET role = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING id, email, first_name, last_name, role`,
      [role, id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res. status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const removeUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, req.user. organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res. json({ message: 'User removed successfully' });
  } catch (err) {
    next(err);
  }
};

const inviteUser = async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const inviteId = uuidv4();

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role required' });
    }

    const result = await pool. query(
      `INSERT INTO user_invitations (id, organization_id, email, role, created_at, expires_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days')
       RETURNING *`,
      [inviteId, req.user.organizationId, email, role]
    );

    // In production, send invitation email
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const resendInvite = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update expires_at to 7 days from now
    const result = await pool.query(
      `UPDATE user_invitations 
       SET expires_at = NOW() + INTERVAL '7 days'
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res. status(404).json({ error: 'Invitation not found' });
    }

    // In production, resend invitation email
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getOrganizationUsers,
  addUser,
  updateUserRole,
  removeUser,
  inviteUser,
  resendInvite
};