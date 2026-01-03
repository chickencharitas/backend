const { pool } = require('../config/database');

// ============================================================
// TEMPLATES MARKETPLACE
// ============================================================
exports.getPublicTemplates = async (req, res) => {
  try {
    const { category, difficulty, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT pt.*, u.first_name, u.last_name, 
             AVG(tr.rating) as rating_avg,
             COUNT(DISTINCT tr.id) as rating_count
      FROM presentation_templates pt
      LEFT JOIN users u ON pt.creator_id = u.id
      LEFT JOIN template_ratings tr ON pt.id = tr.template_id
      WHERE pt.is_public = true
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND pt.category = $${paramCount++}`;
      params.push(category);
    }
    if (difficulty) {
      query += ` AND pt.difficulty = $${paramCount++}`;
      params.push(difficulty);
    }
    if (search) {
      query += ` AND (pt.title ILIKE $${paramCount} OR pt.description ILIKE $${paramCount + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    query += ` GROUP BY pt.id, u.id ORDER BY pt.is_featured DESC, pt.download_count DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM presentation_templates WHERE is_public = true`
    );

    res.json({
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTemplateDetails = async (req, res) => {
  try {
    const { template_id } = req.params;

    const result = await pool.query(
      `SELECT pt.*, u.first_name, u.last_name
       FROM presentation_templates pt
       LEFT JOIN users u ON pt.creator_id = u.id
       WHERE pt.id = $1`,
      [template_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      template: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching template details:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    const { template_id } = req.params;
    const user_id = req.user.userId;
    const organization_id = req.user.organizationId;

    const template = await pool.query(
      `SELECT * FROM presentation_templates WHERE id = $1`,
      [template_id]
    );

    if (template.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await pool.query(
      `INSERT INTO template_downloads (template_id, user_id, organization_id) VALUES ($1, $2, $3)`,
      [template_id, user_id, organization_id]
    );

    await pool.query(
      `UPDATE presentation_templates SET download_count = download_count + 1 WHERE id = $1`,
      [template_id]
    );

    res.json({ success: true, template: template.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.rateTemplate = async (req, res) => {
  try {
    const { template_id } = req.params;
    const { rating, review } = req.body;
    const user_id = req.user.userId;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await pool.query(
      `INSERT INTO template_ratings (template_id, user_id, rating, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (template_id, user_id) DO UPDATE SET rating = $3, review = $4
       RETURNING *`,
      [template_id, user_id, rating, review]
    );

    // Update average rating
    const avgRating = await pool.query(
      `SELECT AVG(rating) as avg, COUNT(*) as count FROM template_ratings WHERE template_id = $1`,
      [template_id]
    );

    await pool.query(
      `UPDATE presentation_templates SET rating_avg = $1, rating_count = $2 WHERE id = $3`,
      [parseFloat(avgRating.rows[0].avg).toFixed(2), avgRating.rows[0].count, template_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// MEDIA LIBRARY (BACKGROUNDS & MUSIC)
// ============================================================
exports.getLibraries = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `SELECT * FROM media_library WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createLibrary = async (req, res) => {
  try {
    const { library_name, description, media_type, is_public } = req.body;
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `INSERT INTO media_library (organization_id, library_name, description, media_type, is_public)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [organization_id, library_name, description, media_type, is_public]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLibraryItems = async (req, res) => {
  try {
    const { library_id } = req.params;

    const result = await pool.query(
      `SELECT * FROM library_items WHERE library_id = $1 ORDER BY created_at DESC`,
      [library_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addLibraryItem = async (req, res) => {
  try {
    const { library_id } = req.params;
    const { title, description, file_url, file_type, file_size, duration_seconds, artist_name, license_type, tags } = req.body;

    const result = await pool.query(
      `INSERT INTO library_items (library_id, title, description, file_url, file_type, file_size, duration_seconds, artist_name, license_type, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [library_id, title, description, file_url, file_type, file_size, duration_seconds, artist_name, license_type, JSON.stringify(tags || [])]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLibraryItem = async (req, res) => {
  try {
    const { item_id } = req.params;

    await pool.query(
      `DELETE FROM library_items WHERE id = $1`,
      [item_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// COMMUNITY PRESENTATIONS
// ============================================================
exports.getCommunityPresentations = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT cp.*, u.first_name, u.last_name, o.name as organization_name,
             AVG(cpr.rating) as rating_avg,
             COUNT(DISTINCT cpr.id) as rating_count
      FROM community_presentations cp
      LEFT JOIN users u ON cp.creator_id = u.id
      LEFT JOIN organizations o ON cp.organization_id = o.id
      LEFT JOIN community_presentation_ratings cpr ON cp.id = cpr.presentation_id
      WHERE cp.is_public = true
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND cp.category = $${paramCount++}`;
      params.push(category);
    }
    if (search) {
      query += ` AND (cp.title ILIKE $${paramCount} OR cp.description ILIKE $${paramCount + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    query += ` GROUP BY cp.id, u.id, o.id ORDER BY cp.is_featured DESC, cp.view_count DESC LIMIT $${paramCount++} OFFSET $${paramCount}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    
    res.json({
      data: result.rows,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (err) {
    console.error('Error fetching community presentations:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.sharePresentationToComm = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const { title, description, category, is_public, tags } = req.body;
    const user_id = req.user.userId;
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `INSERT INTO community_presentations (presentation_id, creator_id, organization_id, title, description, category, is_public, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [presentation_id, user_id, organization_id, title, description, category, is_public, JSON.stringify(tags || [])]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.likePresentationComm = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const user_id = req.user.userId;

    await pool.query(
      `INSERT INTO community_presentation_likes (presentation_id, user_id) VALUES ($1, $2)
       ON CONFLICT (presentation_id, user_id) DO NOTHING`,
      [presentation_id, user_id]
    );

    const likes = await pool.query(
      `SELECT COUNT(*) as count FROM community_presentation_likes WHERE presentation_id = $1`,
      [presentation_id]
    );

    await pool.query(
      `UPDATE community_presentations SET like_count = $1 WHERE id = $2`,
      [likes.rows[0].count, presentation_id]
    );

    res.json({ success: true, likes: parseInt(likes.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.ratePresentationComm = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const { rating, review } = req.body;
    const user_id = req.user.userId;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    await pool.query(
      `INSERT INTO community_presentation_ratings (presentation_id, user_id, rating, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (presentation_id, user_id) DO UPDATE SET rating = $3, review = $4`,
      [presentation_id, user_id, rating, review]
    );

    const avgRating = await pool.query(
      `SELECT AVG(rating) as avg, COUNT(*) as count FROM community_presentation_ratings WHERE presentation_id = $1`,
      [presentation_id]
    );

    await pool.query(
      `UPDATE community_presentations SET rating_avg = $1, rating_count = $2 WHERE id = $3`,
      [parseFloat(avgRating.rows[0].avg).toFixed(2), avgRating.rows[0].count, presentation_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.downloadPresentationComm = async (req, res) => {
  try {
    const { presentation_id } = req.params;
    const user_id = req.user.userId;

    await pool.query(
      `INSERT INTO community_presentation_downloads (presentation_id, user_id) VALUES ($1, $2)`,
      [presentation_id, user_id]
    );

    const downloads = await pool.query(
      `SELECT COUNT(*) as count FROM community_presentation_downloads WHERE presentation_id = $1`,
      [presentation_id]
    );

    await pool.query(
      `UPDATE community_presentations SET download_count = $1 WHERE id = $2`,
      [downloads.rows[0].count, presentation_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// SERMON SERIES & NOTES
// ============================================================
exports.getSermonSeries = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `SELECT ss.*, u.first_name, u.last_name, COUNT(DISTINCT sn.id) as sermon_count
       FROM sermon_series ss
       LEFT JOIN users u ON ss.created_by = u.id
       LEFT JOIN sermon_notes sn ON ss.id = sn.sermon_series_id
       WHERE ss.organization_id = $1
       GROUP BY ss.id, u.id
       ORDER BY ss.created_at DESC`,
      [organization_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sermon series:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createSermonSeries = async (req, res) => {
  try {
    const { title, description, book_of_bible, start_date, end_date, is_public } = req.body;
    const organization_id = req.user.organizationId;
    const created_by = req.user.userId;

    const result = await pool.query(
      `INSERT INTO sermon_series (organization_id, title, description, book_of_bible, start_date, end_date, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [organization_id, title, description, book_of_bible, start_date, end_date, is_public, created_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSermonNotes = async (req, res) => {
  try {
    const { series_id } = req.params;

    const result = await pool.query(
      `SELECT sn.*, u.first_name, u.last_name
       FROM sermon_notes sn
       LEFT JOIN users u ON sn.created_by = u.id
       WHERE sn.sermon_series_id = $1
       ORDER BY sn.sermon_date DESC`,
      [series_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sermon notes:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createSermonNote = async (req, res) => {
  try {
    const { series_id } = req.params;
    const { title, scripture_reference, speaker_name, sermon_date, notes_content, outline, key_points, discussion_questions, prayer_requests } = req.body;
    const created_by = req.user.userId;

    const result = await pool.query(
      `INSERT INTO sermon_notes (sermon_series_id, title, scripture_reference, speaker_name, sermon_date, notes_content, outline, key_points, discussion_questions, prayer_requests, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [series_id, title, scripture_reference, speaker_name, sermon_date, notes_content, JSON.stringify(outline), JSON.stringify(key_points), JSON.stringify(discussion_questions), prayer_requests, created_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSermonNote = async (req, res) => {
  try {
    const { note_id } = req.params;
    const { title, scripture_reference, speaker_name, sermon_date, notes_content, outline, key_points, discussion_questions, prayer_requests } = req.body;

    const result = await pool.query(
      `UPDATE sermon_notes SET title = $1, scripture_reference = $2, speaker_name = $3, sermon_date = $4, notes_content = $5, outline = $6, key_points = $7, discussion_questions = $8, prayer_requests = $9, updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [title, scripture_reference, speaker_name, sermon_date, notes_content, JSON.stringify(outline), JSON.stringify(key_points), JSON.stringify(discussion_questions), prayer_requests, note_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSermonNote = async (req, res) => {
  try {
    const { note_id } = req.params;

    await pool.query(`DELETE FROM sermon_notes WHERE id = $1`, [note_id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSermonSeriesPresets = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `SELECT ssp.*, u.first_name, u.last_name
       FROM sermon_series_presets ssp
       LEFT JOIN users u ON ssp.created_by = u.id
       WHERE ssp.organization_id = $1
       ORDER BY ssp.created_at DESC`,
      [organization_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sermon series presets:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.createSermonSeriesPreset = async (req, res) => {
  try {
    const { preset_name, description, sermon_series_id, is_template, config } = req.body;
    const organization_id = req.user.organizationId;
    const created_by = req.user.userId;

    const result = await pool.query(
      `INSERT INTO sermon_series_presets (organization_id, preset_name, description, sermon_series_id, is_template, config, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [organization_id, preset_name, description, sermon_series_id, is_template, JSON.stringify(config), created_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deploySermonSeriesPreset = async (req, res) => {
  try {
    const { preset_id } = req.params;
    const organization_id = req.user.organizationId;
    const deployed_by = req.user.userId;

    const result = await pool.query(
      `INSERT INTO sermon_series_deployments (organization_id, preset_id, deployed_by) VALUES ($1, $2, $3) RETURNING *`,
      [organization_id, preset_id, deployed_by]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};