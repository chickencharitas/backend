const { pool } = require('../config/database');
const { validate: validateUUID } = require('uuid');

exports.requestApproval = async (req, res) => {
  try {
    const { media_id, approver_id, comment } = req.body;
    const requested_by = req.user?.id || req.user?.userId;
    if (!requested_by) return res.status(401).json({ error: 'Not authenticated' });

    if (!media_id || !validateUUID(media_id)) return res.status(400).json({ error: 'Invalid media_id' });
    if (!approver_id || !validateUUID(approver_id)) return res.status(400).json({ error: 'Invalid approver_id' });

    const result = await pool.query(
      `INSERT INTO media_approvals (media_id, requested_by, approver_id, comment) VALUES ($1, $2, $3, $4) RETURNING *`,
      [media_id, requested_by, approver_id, comment || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('requestApproval error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.respondApproval = async (req, res) => {
  try {
    const { approval_id, status, comment } = req.body;
    if (!approval_id || !validateUUID(approval_id)) return res.status(400).json({ error: 'Invalid approval_id' });
    if (!status) return res.status(400).json({ error: 'Missing status' });

    await pool.query(
      `UPDATE media_approvals SET status = $1, comment = $2, responded_at = NOW() WHERE id = $3`,
      [status, comment || null, approval_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('respondApproval error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getApprovals = async (req, res) => {
  try {
    const orgId = req.params.organizationId || req.user?.organizationId;
    if (!orgId || !validateUUID(orgId)) {
      return res.status(400).json({ error: 'Invalid or missing organization id' });
    }

    const result = await pool.query('SELECT * FROM approvals WHERE organization_id = $1', [orgId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get approvals error:', err);
    res.status(500).json({ error: err.message });
  }
};