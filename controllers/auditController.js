import * as model from '../models/auditModel.js';

// Audit logs
export const getAuditLogs = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(await model.getAuditLogs({ limit: req.query.limit || 50 }));
};

// Security events
export const getSecurityEvents = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(await model.getSecurityEvents({ limit: req.query.limit || 50 }));
};

// Compliance
export const addComplianceRequest = async (req, res) => {
  res.json(await model.addComplianceRequest({ user_id: req.user.id, ...req.body }));
};
export const listComplianceRequests = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(await model.listComplianceRequests({ status: req.query.status }));
};
export const updateComplianceRequestStatus = async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(await model.updateComplianceRequestStatus(req.body));
};