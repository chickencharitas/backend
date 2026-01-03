const { pool } = require('../config/database');

const isUuid = (val) => {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
};

exports.getComments = async (req, res) => {
  try {
    const mediaId = req.params.mediaId || req.query.mediaId || req.body.mediaId;
    if (!mediaId || !isUuid(mediaId)) {
      return res.status(400).json({ error: 'Valid mediaId (UUID) is required' });
    }

    const result = await pool.query(
      `SELECT mc.*, u.firstName, u.lastName, u.email 
       FROM media_comments mc
       LEFT JOIN users u ON mc.user_id = u.id
       WHERE mc.media_id = $1
       ORDER BY mc.created_at DESC`,
      [mediaId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

exports.addComment = async (req, res) => {
  try {
    const mediaId = req.params.mediaId || req.query.mediaId || req.body.mediaId;
    const { comment } = req.body;
    const user_id = req.user?.userId;

    if (!mediaId || !isUuid(mediaId) || !comment || !comment.trim()) {
      return res.status(400).json({ error: 'Valid mediaId and non-empty comment are required' });
    }
    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query(
      `INSERT INTO media_comments (media_id, user_id, comment) 
       VALUES ($1, $2, $3) RETURNING *`,
      [mediaId, user_id, comment.trim()]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId || req.body.commentId;
    const user_id = req.user?.userId;

    if (!commentId || !isUuid(commentId)) {
      return res.status(400).json({ error: 'Valid commentId (UUID) is required' });
    }
    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const comment = await pool.query(
      `SELECT * FROM media_comments WHERE id = $1`,
      [commentId]
    );

    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.query(
      `DELETE FROM media_comments WHERE id = $1`,
      [commentId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const commentId = req.params.commentId || req.body.commentId;
    const { comment } = req.body;
    const user_id = req.user?.userId;

    if (!commentId || !isUuid(commentId) || !comment || !comment.trim()) {
      return res.status(400).json({ error: 'Valid commentId and non-empty comment are required' });
    }
    if (!user_id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const existing = await pool.query(
      `SELECT * FROM media_comments WHERE id = $1`,
      [commentId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existing.rows[0].user_id !== user_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE media_comments SET comment = $1 WHERE id = $2 RETURNING *`,
      [comment.trim(), commentId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateComment error:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};