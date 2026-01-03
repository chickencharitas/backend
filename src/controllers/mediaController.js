const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { MEDIA_TYPES } = require('../config/constants');

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = ['uploads', 'uploads/media', 'uploads/media/thumbnails'];
  dirs.forEach(dir => {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${fullPath}`);
    }
  });
};

const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    ensureUploadDirs();

    const { originalname, filename, size, mimetype, path: filePath } = req.file;
    const { title, description, category, tags } = req.body;
    const mediaId = uuidv4();

    console.log('Upload request:', {
      filename,
      originalname,
      size,
      mimetype,
      filePath,
      userId: req.user?.userId,
      orgId: req.user?.organizationId
    });

    let type = MEDIA_TYPES.DOCUMENT;
    if (mimetype.startsWith('image/')) type = MEDIA_TYPES.IMAGE;
    else if (mimetype.startsWith('video/')) type = MEDIA_TYPES.VIDEO;
    else if (mimetype.startsWith('audio/')) type = MEDIA_TYPES.AUDIO;

    // Generate thumbnail for images
    let thumbnailPath = null;
    if (type === MEDIA_TYPES.IMAGE) {
      thumbnailPath = await generateImageThumbnail(filename, filePath);
    }

    const mediaPath = `/uploads/media/${filename}`;
    const finalThumbnailPath = thumbnailPath ? `/uploads/media/thumbnails/${path.basename(thumbnailPath)}` : null;

    const result = await pool.query(
      `INSERT INTO media (id, title, filename, original_name, type, size, mimetype, path, thumbnail_path, category, tags, uploaded_by, organization_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        mediaId,
        title || originalname.split('.')[0],
        filename,
        originalname,
        type,
        size,
        mimetype,
        mediaPath,
        finalThumbnailPath,
        category || '',
        tags || '[]',
        req.user.userId,
        req.user.organizationId
      ]
    );

    console.log('Media uploaded successfully:', mediaId);
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Upload error:', err);
    next(err);
  }
};

const generateImageThumbnail = async (filename, uploadedFilePath) => {
  try {
    ensureUploadDirs();

    const thumbName = `thumb-${filename}`;
    const inputPath = uploadedFilePath || path.join('uploads/media', filename);
    const outputPath = path.join('uploads/media/thumbnails', thumbName);

    console.log('Generating thumbnail:', {
      inputPath,
      outputPath,
      exists: fs.existsSync(inputPath)
    });

    // Verify input file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`Input file not found: ${inputPath}`);
      return null;
    }

    await sharp(inputPath)
      .resize(200, 200, { fit: 'cover', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    console.log('Thumbnail generated:', outputPath);
    return outputPath;
  } catch (err) {
    console.error('Thumbnail generation failed:', err.message);
    return null;
  }
};

const getMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const getMediaLibrary = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, type, category, search } = req.query;
    let query = 'SELECT * FROM media WHERE organization_id = $1';
    const params = [req.user.organizationId];

    if (type) {
      query += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR original_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit));
    params.push(parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM media WHERE organization_id = $1';
    const countParams = [req.user.organizationId];

    if (type) {
      countQuery += ` AND type = $${countParams.length + 1}`;
      countParams.push(type);
    }

    if (category) {
      countQuery += ` AND category = $${countParams.length + 1}`;
      countParams.push(category);
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParams.length + 1} OR original_name ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      data: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
      total
    });
  } catch (err) {
    next(err);
  }
};

const updateMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, tags } = req.body;

    const result = await pool.query(
      `UPDATE media 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           tags = COALESCE($4, tags),
           updated_at = NOW()
       WHERE id = $5 AND organization_id = $6
       RETURNING *`,
      [title, description, category, tags, id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mediaResult = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaResult.rows[0];

    // Delete files from disk
    try {
      // Handle both relative and absolute paths
      const filePath = media.path.startsWith('/uploads')
        ? media.path.slice(1)
        : media.path;
      
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }

      if (media.thumbnail_path) {
        const thumbPath = media.thumbnail_path.startsWith('/uploads')
          ? media.thumbnail_path.slice(1)
          : media.thumbnail_path;
        
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
          console.log(`Deleted thumbnail: ${thumbPath}`);
        }
      }
    } catch (fileErr) {
      console.error('File deletion error:', fileErr.message);
    }

    // Delete from database
    await pool.query('DELETE FROM media WHERE id = $1', [id]);

    res.json({ message: 'Media deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const searchMedia = async (req, res, next) => {
  try {
    const { query } = req.params;
    const { limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT * FROM media 
       WHERE organization_id = $1 
       AND (title ILIKE $2 OR description ILIKE $2 OR original_name ILIKE $2)
       ORDER BY created_at DESC
       LIMIT $3`,
      [req.user.organizationId, `%${query}%`, parseInt(limit)]
    );

    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
};

const generateThumbnail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = result.rows[0];
    if (media.type !== MEDIA_TYPES.IMAGE) {
      return res.status(400).json({ error: 'Can only generate thumbnails for images' });
    }

    const filePath = media.path.startsWith('/uploads')
      ? media.path.slice(1)
      : media.path;

    const thumbnailPath = await generateImageThumbnail(media.filename, filePath);

    if (!thumbnailPath) {
      return res.status(500).json({ error: 'Thumbnail generation failed' });
    }

    const finalThumbnailPath = `/uploads/media/thumbnails/${path.basename(thumbnailPath)}`;

    const updateResult = await pool.query(
      'UPDATE media SET thumbnail_path = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [finalThumbnailPath, id]
    );

    res.json({ data: updateResult.rows[0] });
  } catch (err) {
    next(err);
  }
};

const getMediaStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = result.rows[0];
    const usageCount = await getMediaUsageCount(id);

    const stats = {
      id: media.id,
      title: media.title,
      type: media.type,
      size: media.size,
      uploadedAt: media.created_at,
      usageCount
    };

    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};

const getMediaUsageCount = async (mediaId) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM slide_media WHERE media_id = $1',
      [mediaId]
    );
    return parseInt(result.rows[0].count || 0);
  } catch (err) {
    console.error('Usage count query failed:', err);
    return 0;
  }
};

module.exports = {
  uploadMedia,
  getMedia,
  getMediaLibrary,
  updateMedia,
  deleteMedia,
  searchMedia,
  generateThumbnail,
  getMediaStats,
  ensureUploadDirs
};