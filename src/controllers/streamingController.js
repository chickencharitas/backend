const { pool } = require('../config/database');

// ============================================================
// LIVE STREAMS
// ============================================================
exports.createLiveStream = async (req, res) => {
  try {
    const { title, description, scheduled_at } = req.body;
    const organization_id = req.user.organizationId;
    const created_by = req.user.userId;
    const stream_key = require('crypto').randomBytes(16).toString('hex');
    
    const result = await pool.query(
      `INSERT INTO live_streams (organization_id, created_by, title, description, stream_key, scheduled_at) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organization_id, created_by, title, description, stream_key, scheduled_at]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStreams = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    const result = await pool.query(
      `SELECT * FROM live_streams WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStreamById = async (req, res) => {
  try {
    const { stream_id } = req.params;
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `SELECT * FROM live_streams WHERE id = $1 AND organization_id = $2`,
      [stream_id, organization_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.startStream = async (req, res) => {
  try {
    const { stream_id } = req.body;
    
    const result = await pool.query(
      `UPDATE live_streams SET status = 'live', started_at = NOW(), viewer_count = 0 WHERE id = $1 RETURNING *`,
      [stream_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.endStream = async (req, res) => {
  try {
    const { stream_id } = req.body;
    
    const result = await pool.query(
      `UPDATE live_streams SET status = 'ended', ended_at = NOW() WHERE id = $1 RETURNING *`,
      [stream_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStream = async (req, res) => {
  try {
    const { stream_id } = req.params;
    const { title, description, thumbnail_url } = req.body;
    
    const result = await pool.query(
      `UPDATE live_streams SET title = $1, description = $2, thumbnail_url = $3, updated_at = NOW() 
       WHERE id = $4 RETURNING *`,
      [title, description, thumbnail_url, stream_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStream = async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    await pool.query(
      `DELETE FROM live_streams WHERE id = $1`,
      [stream_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// STREAMING PLATFORMS
// ============================================================
exports.getPlatforms = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    const result = await pool.query(
      `SELECT id, platform, channel_id, channel_name, is_active, is_connected, created_at 
       FROM streaming_platforms WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPlatform = async (req, res) => {
  try {
    const { platform, api_key, api_secret, access_token, refresh_token, channel_id, channel_name } = req.body;
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `INSERT INTO streaming_platforms (organization_id, platform, api_key, api_secret, access_token, refresh_token, channel_id, channel_name, is_connected) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) 
       ON CONFLICT (organization_id, platform) DO UPDATE SET 
       api_key = $3, api_secret = $4, access_token = $5, refresh_token = $6, channel_id = $7, channel_name = $8, updated_at = NOW()
       RETURNING *`,
      [organization_id, platform, api_key, api_secret, access_token, refresh_token, channel_id, channel_name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removePlatform = async (req, res) => {
  try {
    const { platform_id } = req.params;
    const organization_id = req.user.organizationId;
    
    await pool.query(
      `DELETE FROM streaming_platforms WHERE id = $1 AND organization_id = $2`,
      [platform_id, organization_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// STREAM BROADCASTS
// ============================================================
exports.getBroadcasts = async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    const result = await pool.query(
      `SELECT sb.*, sp.platform, sp.channel_name 
       FROM stream_broadcasts sb
       JOIN streaming_platforms sp ON sb.platform_id = sp.id
       WHERE sb.stream_id = $1
       ORDER BY sb.created_at DESC`,
      [stream_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addBroadcast = async (req, res) => {
  try {
    const { stream_id, platform_id, broadcast_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO stream_broadcasts (stream_id, platform_id, broadcast_url) 
       VALUES ($1, $2, $3) RETURNING *`,
      [stream_id, platform_id, broadcast_url]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateBroadcastStatus = async (req, res) => {
  try {
    const { broadcast_id, status, error_message } = req.body;
    
    const result = await pool.query(
      `UPDATE stream_broadcasts SET status = $1, error_message = $2, updated_at = NOW() 
       WHERE id = $3 RETURNING *`,
      [status, error_message, broadcast_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// CHAT MESSAGES
// ============================================================
exports.getChatMessages = async (req, res) => {
  try {
    const { stream_id } = req.params;
    const limit = req.query.limit || 100;
    
    const result = await pool.query(
      `SELECT * FROM chat_messages 
       WHERE stream_id = $1 AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT $2`,
      [stream_id, limit]
    );
    
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addChatMessage = async (req, res) => {
  try {
    const { stream_id, platform, platform_user_id, username, message, user_avatar_url } = req.body;
    
    const result = await pool.query(
      `INSERT INTO chat_messages (stream_id, platform, platform_user_id, username, message, user_avatar_url) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [stream_id, platform, platform_user_id, username, message, user_avatar_url]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { message_id } = req.params;
    
    const result = await pool.query(
      `UPDATE chat_messages SET is_deleted = true WHERE id = $1 RETURNING *`,
      [message_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pinMessage = async (req, res) => {
  try {
    const { message_id, is_pinned } = req.body;
    
    const result = await pool.query(
      `UPDATE chat_messages SET is_pinned = $1 WHERE id = $2 RETURNING *`,
      [is_pinned, message_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// CHAT MODERATION
// ============================================================
exports.moderateMessage = async (req, res) => {
  try {
    const { message_id, action, reason, duration_seconds } = req.body;
    const moderated_by = req.user.userId;
    
    // Update message as moderated
    await pool.query(
      `UPDATE chat_messages SET is_moderated = true WHERE id = $1`,
      [message_id]
    );
    
    // Log moderation action
    const result = await pool.query(
      `INSERT INTO chat_moderation (message_id, moderated_by, action, reason, duration_seconds) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [message_id, moderated_by, action, reason, duration_seconds]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// VIEWER ANALYTICS
// ============================================================
exports.getAnalytics = async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM viewer_analytics WHERE stream_id = $1`,
      [stream_id]
    );
    
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getViewerTimeline = async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    const result = await pool.query(
      `SELECT timestamp, viewer_count FROM viewer_timeline 
       WHERE stream_id = $1 
       ORDER BY timestamp ASC`,
      [stream_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateViewerCount = async (req, res) => {
  try {
    const { stream_id, viewer_count } = req.body;
    
    // Update live stream
    await pool.query(
      `UPDATE live_streams 
       SET viewer_count = $1, peak_viewers = GREATEST(peak_viewers, $1)
       WHERE id = $2`,
      [viewer_count, stream_id]
    );
    
    // Record timeline
    await pool.query(
      `INSERT INTO viewer_timeline (stream_id, timestamp, viewer_count) 
       VALUES ($1, NOW(), $2)`,
      [stream_id, viewer_count]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAnalytics = async (req, res) => {
  try {
    const { stream_id, platform, peak_viewers, total_unique_viewers, total_chat_messages, engagement_rate, retention_percentage } = req.body;
    
    const result = await pool.query(
      `INSERT INTO viewer_analytics (stream_id, platform, peak_viewers, total_unique_viewers, total_chat_messages, engagement_rate, retention_percentage)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (stream_id) DO UPDATE SET 
       peak_viewers = $3, total_unique_viewers = $4, total_chat_messages = $5, engagement_rate = $6, retention_percentage = $7, updated_at = NOW()
       RETURNING *`,
      [stream_id, platform, peak_viewers, total_unique_viewers, total_chat_messages, engagement_rate, retention_percentage]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// RECORDINGS
// ============================================================
exports.getRecordings = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `SELECT * FROM recordings 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [organization_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecordingsByStream = async (req, res) => {
  try {
    const { stream_id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM recordings 
       WHERE stream_id = $1 
       ORDER BY created_at DESC`,
      [stream_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRecording = async (req, res) => {
  try {
    const { stream_id, title, description, file_path, file_name, duration_seconds, file_size } = req.body;
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `INSERT INTO recordings (stream_id, organization_id, title, description, file_path, file_name, duration_seconds, file_size) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [stream_id, organization_id, title, description, file_path, file_name, duration_seconds, file_size]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRecordingStatus = async (req, res) => {
  try {
    const { recording_id, status, processing_progress, cdn_url, thumbnail_url, error_message } = req.body;
    
    const result = await pool.query(
      `UPDATE recordings 
       SET status = $1, processing_progress = $2, cdn_url = $3, thumbnail_url = $4, error_message = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [status, processing_progress, cdn_url, thumbnail_url, error_message, recording_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRecording = async (req, res) => {
  try {
    const { recording_id } = req.params;
    
    await pool.query(
      `DELETE FROM recordings WHERE id = $1`,
      [recording_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.publishRecording = async (req, res) => {
  try {
    const { recording_id, is_public } = req.body;
    
    const result = await pool.query(
      `UPDATE recordings SET is_public = $1 WHERE id = $2 RETURNING *`,
      [is_public, recording_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// RECORDING FORMATS
// ============================================================
exports.getRecordingFormats = async (req, res) => {
  try {
    const { recording_id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM recording_formats WHERE recording_id = $1 ORDER BY quality`,
      [recording_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addRecordingFormat = async (req, res) => {
  try {
    const { recording_id, quality, file_path, cdn_url, file_size, bitrate_kbps } = req.body;
    
    const result = await pool.query(
      `INSERT INTO recording_formats (recording_id, quality, file_path, cdn_url, file_size, bitrate_kbps) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [recording_id, quality, file_path, cdn_url, file_size, bitrate_kbps]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateFormatStatus = async (req, res) => {
  try {
    const { format_id, status } = req.body;
    
    const result = await pool.query(
      `UPDATE recording_formats SET status = $1 WHERE id = $2 RETURNING *`,
      [status, format_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// CDN PROVIDERS
// ============================================================
exports.getCDNProviders = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `SELECT id, organization_id, provider_name, endpoint, region, is_active, is_primary, created_at 
       FROM cdn_providers 
       WHERE organization_id = $1 
       ORDER BY is_primary DESC, created_at DESC`,
      [organization_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addCDNProvider = async (req, res) => {
  try {
    const { provider_name, api_key, api_secret, endpoint, bucket_name, region, is_primary } = req.body;
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `INSERT INTO cdn_providers (organization_id, provider_name, api_key, api_secret, endpoint, bucket_name, region, is_primary) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [organization_id, provider_name, api_key, api_secret, endpoint, bucket_name, region, is_primary]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCDNProvider = async (req, res) => {
  try {
    const { provider_id } = req.params;
    const { endpoint, bucket_name, region, is_active, is_primary } = req.body;
    
    const result = await pool.query(
      `UPDATE cdn_providers 
       SET endpoint = $1, bucket_name = $2, region = $3, is_active = $4, is_primary = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [endpoint, bucket_name, region, is_active, is_primary, provider_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCDNProvider = async (req, res) => {
  try {
    const { provider_id } = req.params;
    
    await pool.query(
      `DELETE FROM cdn_providers WHERE id = $1`,
      [provider_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// STREAM SETTINGS
// ============================================================
exports.getStreamSettings = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `SELECT * FROM stream_settings WHERE organization_id = $1`,
      [organization_id]
    );
    
    if (result.rows.length === 0) {
      // Create default settings
      const newSettings = await pool.query(
        `INSERT INTO stream_settings (organization_id) VALUES ($1) RETURNING *`,
        [organization_id]
      );
      return res.json(newSettings.rows[0]);
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStreamSettings = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    const { auto_record, record_quality, enable_chat, chat_moderation_enabled, enable_analytics, retention_days, max_concurrent_streams } = req.body;
    
    const result = await pool.query(
      `UPDATE stream_settings 
       SET auto_record = $1, record_quality = $2, enable_chat = $3, chat_moderation_enabled = $4, 
           enable_analytics = $5, retention_days = $6, max_concurrent_streams = $7, updated_at = NOW()
       WHERE organization_id = $8 RETURNING *`,
      [auto_record, record_quality, enable_chat, chat_moderation_enabled, enable_analytics, retention_days, max_concurrent_streams, organization_id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// STREAM WEBHOOKS
// ============================================================
exports.getWebhooks = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `SELECT * FROM stream_webhooks WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addWebhook = async (req, res) => {
  try {
    const { event_type, webhook_url } = req.body;
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `INSERT INTO stream_webhooks (organization_id, event_type, webhook_url) 
       VALUES ($1, $2, $3) RETURNING *`,
      [organization_id, event_type, webhook_url]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteWebhook = async (req, res) => {
  try {
    const { webhook_id } = req.params;
    
    await pool.query(
      `DELETE FROM stream_webhooks WHERE id = $1`,
      [webhook_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// STREAM PRESETS
// ============================================================
exports.getPresets = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    
    const result = await pool.query(
      `SELECT sp.*, u.first_name, u.last_name FROM stream_presets sp
       LEFT JOIN users u ON sp.created_by = u.id
       WHERE sp.organization_id = $1 
       ORDER BY sp.created_at DESC`,
      [organization_id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching presets:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.addPreset = async (req, res) => {
  try {
    const { name, description, platforms, settings } = req.body;
    const organization_id = req.user.organizationId;
    const created_by = req.user.userId;
    
    const result = await pool.query(
      `INSERT INTO stream_presets (organization_id, name, description, platforms, settings, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organization_id, name, description, JSON.stringify(platforms), JSON.stringify(settings), created_by]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePreset = async (req, res) => {
  try {
    const { preset_id } = req.params;
    
    await pool.query(
      `DELETE FROM stream_presets WHERE id = $1`,
      [preset_id]
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};