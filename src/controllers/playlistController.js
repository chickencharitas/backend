const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { PLAYLIST_STATUS } = require('../config/constants');

const createPlaylist = async (req, res, next) => {
  try {
    const { title, description, serviceDate } = req.body;
    const userId = req.user. userId;
    const playlistId = uuidv4();

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const result = await pool.query(
      `INSERT INTO playlists (id, title, description, status, service_date, created_by, organization_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [playlistId, title, description || '', PLAYLIST_STATUS.DRAFT, serviceDate, userId, req.user.organizationId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const playlistResult = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND organization_id = $2',
      [id, req.user. organizationId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404). json({ error: 'Playlist not found' });
    }

    const itemsResult = await pool.query(
      `SELECT pi.*, p.title as presentation_title, s.title as song_title, sc.content as scripture_content
       FROM playlist_items pi
       LEFT JOIN presentations p ON pi.presentation_id = p. id
       LEFT JOIN songs s ON pi.song_id = s. id
       LEFT JOIN scripture_verses sc ON pi.scripture_id = sc.id
       WHERE pi. playlist_id = $1
       ORDER BY pi.item_order ASC`,
      [id]
    );

    const playlist = playlistResult.rows[0];
    playlist.items = itemsResult.rows;

    res.json(playlist);
  } catch (err) {
    next(err);
  }
};

const getPlaylists = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, status, search } = req.query;
    let query = 'SELECT * FROM playlists WHERE organization_id = $1';
    const params = [req.user.organizationId];

    if (status) {
      query += ` AND status = $${params. length + 1}`;
      params.push(status);
    }

    if (search) {
      query += ` AND title ILIKE $${params.length + 1}`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params. push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    next(err);
  }
};

const updatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, serviceDate } = req.body;

    const result = await pool.query(
      `UPDATE playlists 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           service_date = COALESCE($3, service_date),
           updated_at = NOW()
       WHERE id = $4 AND organization_id = $5
       RETURNING *`,
      [title, description, serviceDate, id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deletePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete playlist items first
    await pool.query('DELETE FROM playlist_items WHERE playlist_id = $1', [id]);

    const result = await pool.query(
      'DELETE FROM playlists WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, req. user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404). json({ error: 'Playlist not found' });
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const addPlaylistItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, presentationId, songId, scriptureId, videoId, duration, notes } = req.body;
    const itemId = uuidv4();

    // Get next item order
    const orderResult = await pool.query(
      'SELECT MAX(item_order) as max_order FROM playlist_items WHERE playlist_id = $1',
      [id]
    );
    const itemOrder = (orderResult.rows[0]. max_order || 0) + 1;

    const result = await pool.query(
      `INSERT INTO playlist_items (id, playlist_id, type, presentation_id, song_id, scripture_id, video_id, duration, notes, item_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [itemId, id, type, presentationId || null, songId || null, scriptureId || null, videoId || null, duration || null, notes || '', itemOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const removePlaylistItem = async (req, res, next) => {
  try {
    const { id, itemId } = req.params;

    const result = await pool.query(
      'DELETE FROM playlist_items WHERE id = $1 AND playlist_id = $2 RETURNING item_order',
      [itemId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist item not found' });
    }

    // Reorder remaining items
    await pool.query(
      `UPDATE playlist_items 
       SET item_order = item_order - 1 
       WHERE playlist_id = $1 AND item_order > $2`,
      [id, result.rows[0].item_order]
    );

    res.json({ message: 'Item removed successfully' });
  } catch (err) {
    next(err);
  }
};

const reorderPlaylistItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { itemId, newOrder }

    for (const item of items) {
      await pool.query(
        'UPDATE playlist_items SET item_order = $1 WHERE id = $2 AND playlist_id = $3',
        [item.newOrder, item.itemId, id]
      );
    }

    res. json({ message: 'Playlist reordered successfully' });
  } catch (err) {
    next(err);
  }
};

const duplicatePlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newPlaylistId = uuidv4();

    const playlistResult = await pool.query(
      'SELECT * FROM playlists WHERE id = $1 AND organization_id = $2',
      [id, req.user. organizationId]
    );

    if (playlistResult.rows.length === 0) {
      return res.status(404). json({ error: 'Playlist not found' });
    }

    const original = playlistResult.rows[0];

    const newPlaylistResult = await pool.query(
      `INSERT INTO playlists (id, title, description, status, service_date, created_by, organization_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [newPlaylistId, `${original.title} (Copy)`, original.description, PLAYLIST_STATUS. DRAFT, original.service_date, req.user.userId, req.user.organizationId]
    );

    // Copy items
    const itemsResult = await pool.query(
      'SELECT * FROM playlist_items WHERE playlist_id = $1 ORDER BY item_order ASC',
      [id]
    );

    for (const item of itemsResult. rows) {
      const newItemId = uuidv4();
      await pool.query(
        `INSERT INTO playlist_items (id, playlist_id, type, presentation_id, song_id, scripture_id, video_id, duration, notes, item_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [newItemId, newPlaylistId, item.type, item.presentation_id, item.song_id, item.scripture_id, item.video_id, item.duration, item.notes, item.item_order]
      );
    }

    res.status(201).json(newPlaylistResult.rows[0]);
  } catch (err) {
    next(err);
  }
};

const publishPlaylist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE playlists 
       SET status = $1, published_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [PLAYLIST_STATUS.ACTIVE, id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Emit real-time event
    const io = req.app.get('io');
    io.of('/congregation').emit('playlist_active', result.rows[0]);

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getPlaylistHistory = async (req, res, next) => {
  try {
    const { id } = req. params;
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT * FROM playlist_history 
       WHERE playlist_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [id, limit]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPlaylist,
  getPlaylist,
  getPlaylists,
  updatePlaylist,
  deletePlaylist,
  addPlaylistItem,
  removePlaylistItem,
  reorderPlaylistItems,
  duplicatePlaylist,
  publishPlaylist,
  getPlaylistHistory
};