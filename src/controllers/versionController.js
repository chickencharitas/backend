const { pool } = require('../config/database');

exports.addVersion = async (req, res) => {
  const { media_id, file_url, change_summary } = req.body;
  const created_by = req.user.userId;
  // Get latest version number
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version FROM media_versions WHERE media_id = $1`,
    [media_id]
  );
  const version_number = rows[0].next_version;
  const result = await pool.query(
    `INSERT INTO media_versions (media_id, version_number, created_by, file_url, change_summary) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [media_id, version_number, created_by, file_url, change_summary]
  );
  res.json(result.rows[0]);
};

exports.getVersions = async (req, res) => {
  const { media_id } = req.params;
  const result = await pool.query(
    `SELECT * FROM media_versions WHERE media_id = $1 ORDER BY version_number DESC`,
    [media_id]
  );
  res.json(result.rows);
};