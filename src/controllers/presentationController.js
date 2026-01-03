const { pool } = require('../config/database');
const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const { PRESENTATION_TYPES } = require('../config/constants');

// Live presentation management
const startLivePresentation = async (req, res, next) => {
  try {
    const { presentationId } = req.params;

    if (!uuidValidate(presentationId)) return res.status(400).json({ error: 'Invalid presentation id' });

    const userId = req.user.userId;

    // Check if presentation exists
    const presResult = await pool.query(
      'SELECT * FROM presentations WHERE id = $1 AND organization_id = $2',
      [presentationId, req.user.organizationId]
    );

    if (presResult.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    // Check if there's already an active live presentation for this presentation
    const activeResult = await pool.query(
      'SELECT * FROM live_presentations WHERE presentation_id = $1 AND is_active = true',
      [presentationId]
    );

    if (activeResult.rows.length > 0) {
      return res.status(409).json({ error: 'Presentation is already live' });
    }

    // Start live presentation
    const result = await pool.query(
      `INSERT INTO live_presentations
       (presentation_id, organization_id, is_active, started_at, created_by)
       VALUES ($1, $2, true, NOW(), $3)
       RETURNING *`,
      [presentationId, req.user.organizationId, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const endLivePresentation = async (req, res, next) => {
  try {
    const { presentationId } = req.params;

    const result = await pool.query(
      `UPDATE live_presentations
       SET is_active = false, ended_at = NOW()
       WHERE presentation_id = $1 AND organization_id = $2 AND is_active = true
       RETURNING *`,
      [presentationId, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active live presentation found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getLivePresentation = async (req, res, next) => {
  try {
    const { presentationId } = req.params;

    if (!uuidValidate(presentationId)) return res.status(400).json({ error: 'Invalid presentation id' });

    const result = await pool.query(
      `SELECT lp.*, p.title, p.description
       FROM live_presentations lp
       JOIN presentations p ON lp.presentation_id = p.id
       WHERE lp.presentation_id = $1 AND lp.organization_id = $2`,
      [presentationId, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Live presentation not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateLiveSlide = async (req, res, next) => {
  try {
    const { presentationId } = req.params;
    const { slideIndex, action, controllerId, notes } = req.body;

    if (!uuidValidate(presentationId)) return res.status(400).json({ error: 'Invalid presentation id' });

    // Update current slide
    const result = await pool.query(
      `UPDATE live_presentations
       SET current_slide_index = $1, updated_at = NOW()
       WHERE presentation_id = $2 AND organization_id = $3 AND is_active = true
       RETURNING *`,
      [slideIndex, presentationId, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active live presentation found' });
    }

    // Log the action
    await pool.query(
      `INSERT INTO presentation_history
       (live_presentation_id, action, slide_index, controller_id, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [result.rows[0].id, action || 'goto_slide', slideIndex, controllerId, req.user.userId, notes]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Slide formatting
const updateSlideFormatting = async (req, res, next) => {
  try {
    const { id, slideId } = req.params;
    const formatting = req.body;

    const result = await pool.query(
      `INSERT INTO slide_formatting (slide_id, content_type, text_content, font_family,
       font_size, font_color, font_weight, text_align, background_color, background_opacity,
       shadow_color, shadow_blur, shadow_offset_x, shadow_offset_y, line_height,
       letter_spacing, text_transform, border_width, border_color, border_radius,
       padding_top, padding_right, padding_bottom, padding_left, position_x, position_y,
       width, height, z_index, animation_in, animation_out, animation_duration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
       $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
       ON CONFLICT (slide_id) DO UPDATE SET
         content_type = EXCLUDED.content_type,
         text_content = EXCLUDED.text_content,
         font_family = EXCLUDED.font_family,
         font_size = EXCLUDED.font_size,
         font_color = EXCLUDED.font_color,
         font_weight = EXCLUDED.font_weight,
         text_align = EXCLUDED.text_align,
         background_color = EXCLUDED.background_color,
         background_opacity = EXCLUDED.background_opacity,
         shadow_color = EXCLUDED.shadow_color,
         shadow_blur = EXCLUDED.shadow_blur,
         shadow_offset_x = EXCLUDED.shadow_offset_x,
         shadow_offset_y = EXCLUDED.shadow_offset_y,
         line_height = EXCLUDED.line_height,
         letter_spacing = EXCLUDED.letter_spacing,
         text_transform = EXCLUDED.text_transform,
         border_width = EXCLUDED.border_width,
         border_color = EXCLUDED.border_color,
         border_radius = EXCLUDED.border_radius,
         padding_top = EXCLUDED.padding_top,
         padding_right = EXCLUDED.padding_right,
         padding_bottom = EXCLUDED.padding_bottom,
         padding_left = EXCLUDED.padding_left,
         position_x = EXCLUDED.position_x,
         position_y = EXCLUDED.position_y,
         width = EXCLUDED.width,
         height = EXCLUDED.height,
         z_index = EXCLUDED.z_index,
         animation_in = EXCLUDED.animation_in,
         animation_out = EXCLUDED.animation_out,
         animation_duration = EXCLUDED.animation_duration,
         updated_at = NOW()
       RETURNING *`,
      [slideId, formatting.contentType, formatting.textContent, formatting.fontFamily,
       formatting.fontSize, formatting.fontColor, formatting.fontWeight, formatting.textAlign,
       formatting.backgroundColor, formatting.backgroundOpacity, formatting.shadowColor,
       formatting.shadowBlur, formatting.shadowOffsetX, formatting.shadowOffsetY,
       formatting.lineHeight, formatting.letterSpacing, formatting.textTransform,
       formatting.borderWidth, formatting.borderColor, formatting.borderRadius,
       formatting.paddingTop, formatting.paddingRight, formatting.paddingBottom,
       formatting.paddingLeft, formatting.positionX, formatting.positionY,
       formatting.width, formatting.height, formatting.zIndex, formatting.animationIn,
       formatting.animationOut, formatting.animationDuration]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getSlideFormatting = async (req, res, next) => {
  try {
    const { id, slideId } = req.params;

    const result = await pool.query(
      'SELECT * FROM slide_formatting WHERE slide_id = $1',
      [slideId]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Presentation cues
const createCue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slideIndex, cueName, hotkey, action, targetSlideIndex, transitionType, transitionDuration, notes } = req.body;

    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid presentation id' });

    const result = await pool.query(
      `INSERT INTO presentation_cues
       (presentation_id, slide_index, cue_name, hotkey, action, target_slide_index,
        transition_type, transition_duration, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, slideIndex, cueName, hotkey, action, targetSlideIndex, transitionType, transitionDuration, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getCues = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid presentation id' });

    const result = await pool.query(
      'SELECT * FROM presentation_cues WHERE presentation_id = $1 ORDER BY slide_index',
      [id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const updateCue = async (req, res, next) => {
  try {
    const { id, cueId } = req.params;
    const { slideIndex, cueName, hotkey, action, targetSlideIndex, transitionType, transitionDuration, notes } = req.body;

    const result = await pool.query(
      `UPDATE presentation_cues
       SET slide_index = $1, cue_name = $2, hotkey = $3, action = $4,
           target_slide_index = $5, transition_type = $6, transition_duration = $7, notes = $8
       WHERE id = $9 AND presentation_id = $10
       RETURNING *`,
      [slideIndex, cueName, hotkey, action, targetSlideIndex, transitionType, transitionDuration, notes, cueId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cue not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteCue = async (req, res, next) => {
  try {
    const { id, cueId } = req.params;

    const result = await pool.query(
      'DELETE FROM presentation_cues WHERE id = $1 AND presentation_id = $2 RETURNING id',
      [cueId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cue not found' });
    }

    res.json({ message: 'Cue deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Slide notes for stage monitor
const updateSlideNotes = async (req, res, next) => {
  try {
    const { id, slideId } = req.params;
    const { noteType, content, visibleOnStage, fontSize, fontColor, backgroundColor, position } = req.body;

    const result = await pool.query(
      `INSERT INTO slide_notes (slide_id, note_type, content, visible_on_stage,
       font_size, font_color, background_color, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slide_id, note_type) DO UPDATE SET
         content = EXCLUDED.content,
         visible_on_stage = EXCLUDED.visible_on_stage,
         font_size = EXCLUDED.font_size,
         font_color = EXCLUDED.font_color,
         background_color = EXCLUDED.background_color,
         position = EXCLUDED.position,
         updated_at = NOW()
       RETURNING *`,
      [slideId, noteType, content, visibleOnStage, fontSize, fontColor, backgroundColor, position]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getSlideNotes = async (req, res, next) => {
  try {
    const { id, slideId } = req.params;

    const result = await pool.query(
      'SELECT * FROM slide_notes WHERE slide_id = $1',
      [slideId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Display profiles
const getDisplayProfiles = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM display_profiles WHERE organization_id = $1 ORDER BY display_type, profile_name',
      [req.user.organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const updateDisplayProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;
    const profileData = req.body;

    const result = await pool.query(
      `UPDATE display_profiles
       SET profile_name = $1, resolution_width = $2, resolution_height = $3,
           background_color = $4, safe_zone_enabled = $5, safe_zone_percentage = $6,
           font_scaling = $7, show_slide_numbers = $8, show_clock = $9,
           show_logo = $10, logo_position = $11, logo_opacity = $12,
           watermark_enabled = $13, watermark_text = $14, watermark_font = $15,
           watermark_size = $16, watermark_color = $17, watermark_opacity = $18,
           is_active = $19, updated_at = NOW()
       WHERE id = $20 AND organization_id = $21
       RETURNING *`,
      [profileData.profileName, profileData.resolutionWidth, profileData.resolutionHeight,
       profileData.backgroundColor, profileData.safeZoneEnabled, profileData.safeZonePercentage,
       profileData.fontScaling, profileData.showSlideNumbers, profileData.showClock,
       profileData.showLogo, profileData.logoPosition, profileData.logoOpacity,
       profileData.watermarkEnabled, profileData.watermarkText, profileData.watermarkFont,
       profileData.watermarkSize, profileData.watermarkColor, profileData.watermarkOpacity,
       profileData.isActive, profileId, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Display profile not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const createPresentation = async (req, res, next) => {
  try {
    const { title, description, type, organizationId } = req.body;
    const userId = req.user.userId;
    const presentationId = uuidv4();

    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const result = await pool.query(
      `INSERT INTO presentations (id, title, description, type, created_by, organization_id, created_at, updated_at, created_by_audit, updated_by_audit)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
       RETURNING *`,
      [presentationId, title, description || '', type || PRESENTATION_TYPES.CUSTOM, userId, organizationId || req.user.organizationId, userId, userId]
    );

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, changes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [organizationId || req.user.organizationId, userId, 'CREATE', 'presentation', presentationId, JSON.stringify({ title, description, type })]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getPresentation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!uuidValidate(id)) return res.status(400).json({ error: 'Invalid presentation id' });

    const presentationResult = await pool.query(
      'SELECT * FROM presentations WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );

    if (presentationResult.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const slidesResult = await pool.query(
      'SELECT * FROM presentation_slides WHERE presentation_id = $1 ORDER BY slide_order ASC',
      [id]
    );

    const presentation = presentationResult.rows[0];
    presentation.slides = slidesResult.rows;

    res.json(presentation);
  } catch (err) {
    next(err);
  }
};

const getPresentations = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, search, type } = req.query;
    let query = `
      SELECT 
        p.*,
        COALESCE(slide_counts.slide_count, 0) as slide_count
      FROM presentations p
      LEFT JOIN (
        SELECT 
          presentation_id, 
          COUNT(id) as slide_count
        FROM presentation_slides
        GROUP BY presentation_id
      ) slide_counts ON p.id = slide_counts.presentation_id
      WHERE p.organization_id = $1 AND p.deleted_at IS NULL
    `;
    const params = [req.user.organizationId];

    if (search) {
      query += ` AND (p.title ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (type) {
      query += ` AND p.type = $${params.length + 1}`;
      params.push(type);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: result.rows.length
    });
  } catch (err) {
    next(err);
  }
};

const updatePresentation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, type } = req.body;
    const userId = req.user.userId;

    // Get original presentation for audit
    const originalResult = await pool.query(
      'SELECT * FROM presentations WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );

    if (originalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const original = originalResult.rows[0];

    const result = await pool.query(
      `UPDATE presentations 
       SET title = COALESCE($1, title), 
           description = COALESCE($2, description),
           type = COALESCE($3, type),
           updated_at = NOW(),
           updated_by_audit = $4
       WHERE id = $5 AND organization_id = $6
       RETURNING *`,
      [title, description, type, userId, id, req.user.organizationId]
    );

    // Log audit trail
    const changes = {
      before: { title: original.title, description: original.description, type: original.type },
      after: { title, description, type }
    };

    await pool.query(
      `INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, changes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.user.organizationId, userId, 'UPDATE', 'presentation', id, JSON.stringify(changes)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deletePresentation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Get original presentation for audit
    const originalResult = await pool.query(
      'SELECT * FROM presentations WHERE id = $1 AND organization_id = $2 AND deleted_at IS NULL',
      [id, req.user.organizationId]
    );

    if (originalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const original = originalResult.rows[0];

    // Soft delete - mark as deleted instead of actually deleting
    const result = await pool.query(
      `UPDATE presentations 
       SET deleted_at = NOW(),
           deleted_by = $1,
           updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [userId, id, req.user.organizationId]
    );

    // Log audit trail
    await pool.query(
      `INSERT INTO audit_log (organization_id, user_id, action, resource_type, resource_id, changes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [req.user.organizationId, userId, 'DELETE', 'presentation', id, JSON.stringify({ deleted_presentation: original })]
    );

    res.json({ message: 'Presentation deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const addSlide = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, layout, background, mediaIds } = req.body;

    // Validate presentation ID
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ 
        error: 'Invalid presentation ID', 
        message: 'Presentation ID is required and must be valid' 
      });
    }

    const slideId = uuidv4();

    // Get next slide order
    const orderResult = await pool.query(
      'SELECT MAX(slide_order) as max_order FROM presentation_slides WHERE presentation_id = $1',
      [id]
    );
    const slideOrder = (orderResult.rows[0].max_order || 0) + 1;

    const result = await pool.query(
      `INSERT INTO presentation_slides (id, presentation_id, title, content, layout, background, slide_order, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [slideId, id, title || '', content || '', layout || 'standard', background || '', slideOrder]
    );

    // Add media associations if provided
    if (mediaIds && mediaIds.length > 0) {
      for (const mediaId of mediaIds) {
        await pool.query(
          'INSERT INTO slide_media (slide_id, media_id) VALUES ($1, $2)',
          [slideId, mediaId]
        );
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateSlide = async (req, res, next) => {
  try {
    const { id, slideId } = req.params;
    const { title, content, layout, background } = req.body;

    const result = await pool.query(
      `UPDATE presentation_slides 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           layout = COALESCE($3, layout),
           background = COALESCE($4, background),
           updated_at = NOW()
       WHERE id = $5 AND presentation_id = $6
       RETURNING *`,
      [title, content, layout, background, slideId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteSlide = async (req, res, next) => {
  try {
    const { id, slideId } = req.params;

    // Delete associated media
    await pool.query('DELETE FROM slide_media WHERE slide_id = $1', [slideId]);

    const result = await pool.query(
      'DELETE FROM presentation_slides WHERE id = $1 AND presentation_id = $2 RETURNING id',
      [slideId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    // Reorder remaining slides
    await pool.query(
      `UPDATE presentation_slides 
       SET slide_order = slide_order - 1 
       WHERE presentation_id = $1 AND slide_order > (
         SELECT slide_order FROM presentation_slides WHERE id = $2
       )`,
      [id, slideId]
    );

    res.json({ message: 'Slide deleted successfully' });
  } catch (err) {
    next(err);
  }
};

const duplicatePresentation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newPresentationId = uuidv4();

    // Get original presentation
    const presResult = await pool.query(
      'SELECT * FROM presentations WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );

    if (presResult.rows.length === 0) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    const original = presResult.rows[0];

    // Create new presentation
    const newPresResult = await pool.query(
      `INSERT INTO presentations (id, title, description, type, created_by, organization_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [newPresentationId, `${original.title} (Copy)`, original.description, original.type, req.user.userId, req.user.organizationId]
    );

    // Copy slides
    const slidesResult = await pool.query(
      'SELECT * FROM presentation_slides WHERE presentation_id = $1 ORDER BY slide_order ASC',
      [id]
    );

    for (const slide of slidesResult.rows) {
      const newSlideId = uuidv4();
      await pool.query(
        `INSERT INTO presentation_slides (id, presentation_id, title, content, layout, background, slide_order, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [newSlideId, newPresentationId, slide.title, slide.content, slide.layout, slide.background, slide.slide_order]
      );

      // Copy slide media associations
      const mediaResult = await pool.query(
        'SELECT media_id FROM slide_media WHERE slide_id = $1',
        [slide.id]
      );

      for (const media of mediaResult.rows) {
        await pool.query(
          'INSERT INTO slide_media (slide_id, media_id) VALUES ($1, $2)',
          [newSlideId, media.media_id]
        );
      }
    }

    res.status(201).json(newPresResult.rows[0]);
  } catch (err) {
    next(err);
  }
};

const importPowerPoint = async (req, res, next) => {
  try {
    // This is a placeholder for PowerPoint import
    // In production, you'd use a library like officegen or LibreOffice
    res.status(501).json({ error: 'PowerPoint import feature coming soon' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPresentation,
  getPresentation,
  getPresentations,
  updatePresentation,
  deletePresentation,
  addSlide,
  updateSlide,
  deleteSlide,
  duplicatePresentation,
  importPowerPoint,
  // Live presentation control
  startLivePresentation,
  endLivePresentation,
  getLivePresentation,
  updateLiveSlide,
  // Slide formatting
  updateSlideFormatting,
  getSlideFormatting,
  // Cues and hotkeys
  createCue,
  getCues,
  updateCue,
  deleteCue,
  // Slide notes for stage monitor
  updateSlideNotes,
  getSlideNotes,
  // Display profiles
  getDisplayProfiles,
  updateDisplayProfile
};