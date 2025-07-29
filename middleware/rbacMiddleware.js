// Dummy, accepts all. Implement real RBAC as needed.
export const requirePermission = (permission) => (req, res, next) => next();