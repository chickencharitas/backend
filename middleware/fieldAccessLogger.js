import { logAudit } from '../models/auditModel.js';

export function fieldAccessLogger(fields) {
  return async (req, res, next) => {
    const user_id = req.user?.id;
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        logAudit({
          user_id,
          action: 'field_access',
          target_type: req.baseUrl,
          target_id: req.params.id,
          meta: { field, value: req.body[field] },
          ip_address: req.ip,
          user_agent: req.headers['user-agent']
        });
      }
    });
    next();
  };
}