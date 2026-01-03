const { ROLE_PERMISSIONS } = require('../config/constants');

const rbac = (requiredPermissions = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
      }

      const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
      
      const hasPermission = requiredPermissions.every(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermissions,
          have: userPermissions
        });
      }

      next();
    } catch (err) {
      console.error('RBAC error:', err);
      res.status(500).json({
        error: 'Authorization check failed',
        code: 'AUTH_CHECK_FAILED'
      });
    }
  };
};

const authorize = rbac;

const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({
      error: 'Admin check failed',
      code: 'ADMIN_CHECK_FAILED'
    });
  }
};

const isEditor = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const allowedRoles = ['admin', 'editor'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Editor or admin access required',
        code: 'EDITOR_REQUIRED'
      });
    }

    next();
  } catch (err) {
    console.error('Editor check error:', err);
    res.status(500).json({
      error: 'Editor check failed',
      code: 'EDITOR_CHECK_FAILED'
    });
  }
};

const isOwner = (resourceUserIdField = 'uploaded_by') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'User not authenticated',
          code: 'NOT_AUTHENTICATED'
        });
      }

      if (req.user.role === 'admin') {
        return next();
      }

      req.isOwner = (resource) => {
        if (!resource) return false;
        return (
          resource[resourceUserIdField] === req.user.userId ||
          resource.user_id === req.user.userId ||
          resource.uploaded_by === req.user.userId ||
          resource.created_by === req.user.userId
        );
      };

      next();
    } catch (err) {
      console.error('Ownership check error:', err);
      res.status(500).json({
        error: 'Ownership check failed',
        code: 'OWNERSHIP_CHECK_FAILED'
      });
    }
  };
};

module.exports = rbac;
module.exports.rbac = rbac;
module.exports.authorize = authorize;
module.exports.isAdmin = isAdmin;
module.exports.isEditor = isEditor;
module.exports.isOwner = isOwner;