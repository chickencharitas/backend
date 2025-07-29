import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { getAuditLogs } from '../models/auditModel.js';

export async function exportComplianceCSV(req, res) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const logs = await getAuditLogs({ limit: 1000 });
  const parser = new Parser();
  const csv = parser.parse(logs);
  res.header('Content-Type', 'text/csv');
  res.attachment('compliance_report.csv');
  res.send(csv);
}

export async function exportCompliancePDF(req, res) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const logs = await getAuditLogs({ limit: 1000 });
  const doc = new PDFDocument();
  res.header('Content-Type', 'application/pdf');
  res.attachment('compliance_report.pdf');
  doc.pipe(res);
  doc.fontSize(16).text('Compliance Audit Report', { align: 'center' });
  logs.forEach(l => {
    doc.fontSize(10).text(`${l.created_at} | ${l.user_name} | ${l.action} | ${l.target_type} ${l.target_id}`);
  });
  doc.end();
}