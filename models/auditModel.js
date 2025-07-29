import db from '../config/db.js';

// Audit log
export const logAudit = async ({ user_id, action, target_type, target_id, meta, ip_address, user_agent }) =>
  await db.query(
    `INSERT INTO audit_log (user_id, action, target_type, target_id, meta, ip_address, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [user_id, action, target_type, target_id, meta, ip_address, user_agent]
  );

export const getAuditLogs = async ({ limit = 50 }) =>
  (await db.query(
    `SELECT l.*, u.name as user_name FROM audit_log l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT $1`,
    [limit]
  )).rows;

// Security events
export const logSecurityEvent = async ({ user_id, event_type, details, ip_address }) =>
  await db.query(
    `INSERT INTO security_events (user_id, event_type, details, ip_address) VALUES ($1,$2,$3,$4)`,
    [user_id, event_type, details, ip_address]
  );

export const getSecurityEvents = async ({ limit = 50 }) =>
  (await db.query(
    `SELECT e.*, u.name as user_name FROM security_events e LEFT JOIN users u ON e.user_id = u.id ORDER BY e.created_at DESC LIMIT $1`,
    [limit]
  )).rows;

// Compliance requests
export const addComplianceRequest = async ({ user_id, type, details }) =>
  (await db.query(
    `INSERT INTO compliance_requests (user_id, type, details) VALUES ($1, $2, $3) RETURNING *`,
    [user_id, type, details]
  )).rows[0];

export const listComplianceRequests = async ({ status, limit = 50 }) => {
  let q = `SELECT r.*, u.name as user_name FROM compliance_requests r LEFT JOIN users u ON r.user_id = u.id WHERE 1=1`;
  let params = [];
  if (status) { q += ` AND r.status = $${params.length + 1}`; params.push(status); }
  q += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1}`; params.push(limit);
  return (await db.query(q, params)).rows;
};

export const updateComplianceRequestStatus = async ({ id, status }) =>
  (await db.query(
    `UPDATE compliance_requests SET status=$2, processed_at=NOW() WHERE id=$1 RETURNING *`,
    [id, status]
  )).rows[0];