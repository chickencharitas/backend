const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

function getTokenFromRequest(req) {
  const authHeader = (req.headers?.authorization || '').trim();
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) return authHeader.slice(7).trim();
  if (req.cookies && req.cookies.token) return req.cookies.token;
  if (req.query && req.query.token) return req.query.token;
  return null;
}

const authenticate = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('Authentication configuration error: JWT_SECRET not set');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    // Optional verification settings (validate if set in env)
    const verifyOptions = {};
    if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
    if (process.env.JWT_AUDIENCE) verifyOptions.audience = process.env.JWT_AUDIENCE;
    if (process.env.JWT_ALGORITHMS) verifyOptions.algorithms = process.env.JWT_ALGORITHMS.split(',').map(a => a.trim());

    let decoded;
    try {
      decoded = jwt.verify(token, secret, verifyOptions);
    } catch (err) {
      const name = err && err.name;
      if (name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
      if (name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token' });
      if (name === 'NotBeforeError') return res.status(401).json({ error: 'Token not active' });
      console.error('JWT verify error:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tokenUserId = decoded.userId || decoded.id || decoded.sub;
    if (!tokenUserId) {
      console.error('Token payload missing user identifier');
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    const userResult = await pool.query(
      'SELECT id, role, organization_id, email, first_name, last_name FROM users WHERE id = $1',
      [tokenUserId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      userId: user.id,
      role: user.role,
      organizationId: user.organization_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      tokenPayload: decoded 
    };

    next();
  } catch (err) {
    console.error('Authentication middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (allowedRoles.length === 0) return next(); 
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

const verifyOrganization = async (req, res, next) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(403).json({ error: 'Organization not set for user' });

    const r = await pool.query('SELECT id FROM organizations WHERE id = $1', [orgId]);
    if (r.rows.length === 0) return res.status(403).json({ error: 'Organization not found' });

    next();
  } catch (err) {
    console.error('verifyOrganization error:', err);
    res.status(500).json({ error: 'Organization verification failed' });
  }
};

module.exports = {
  authenticate,
  authorize,
  verifyOrganization,
  getTokenFromRequest
};