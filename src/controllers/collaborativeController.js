const { pool } = require('../config/database');

exports.startSession = async (req, res) => {
  const { media_id } = req.body;
  const user_id = req.user.userId;
  const result = await pool.query(
    `INSERT INTO collaborative_sessions (media_id, started_by) VALUES ($1, $2) RETURNING *`,
    [media_id, user_id]
  );
  res.json(result.rows[0]);
};

exports.joinSession = async (req, res) => {
  const { session_id } = req.body;
  const user_id = req.user.userId;
  await pool.query(
    `INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [session_id, user_id]
  );
  res.json({ success: true });
};

exports.endSession = async (req, res) => {
  const { session_id } = req.body;
  await pool.query(
    `UPDATE collaborative_sessions SET ended_at = NOW(), is_active = false WHERE id = $1`,
    [session_id]
  );
  res.json({ success: true });
};