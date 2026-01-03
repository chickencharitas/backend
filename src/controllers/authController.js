const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { SUBSCRIPTION_TIERS } = require('../config/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '24h';
const REFRESH_EXPIRY = '7d';

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, organizationName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400). json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt. hash(password, 10);
    const userId = uuidv4();
    const organizationId = uuidv4();

    // Create organization
    await pool.query(
      `INSERT INTO organizations (id, name, tier, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [organizationId, organizationName || `${firstName}'s Organization`, SUBSCRIPTION_TIERS.FREE]
    );

    // Create user
    await pool.query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, organization_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [userId, email, hashedPassword, firstName, lastName, 'admin', organizationId]
    );

    // Create default settings
    await pool.query(
      `INSERT INTO user_settings (user_id, organization_id, theme, language, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, organizationId, 'light', 'en']
    );

    const token = jwt.sign(
      { userId, email, role: 'admin', organizationId },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId },
      JWT_SECRET,
      { expiresIn: REFRESH_EXPIRY }
    );

    res.status(201). json({
      message: 'Registration successful',
      token,
      refreshToken,
      user: { userId, email, firstName, lastName, role: 'admin' }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows. length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, organizationId: user.organization_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: REFRESH_EXPIRY }
    );

    res. json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user. last_name,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, role, organization_id FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, organizationId: user.organization_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res. json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

const logout = async (req, res, next) => {
  try {
    // Add token to blacklist (optional - implement with Redis)
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
};