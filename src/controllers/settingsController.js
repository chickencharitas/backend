const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get user settings
const getSettings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const result = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      // return defaults instead of inserting a row with null user_id
      return res.json({
        theme: 'light',
        language: 'en',
        notifications: true
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get user settings error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update user settings
const updateSettings = async (req, res, next) => {
  try {
    const { theme, language, notifications, autoSave, defaultScriptureTranslation } = req.body;

    console.log('Updating settings for user:', req.user.userId);
    console.log('Update data:', { theme, language, notifications, autoSave });

    const result = await pool.query(
      `UPDATE user_settings 
       SET theme = COALESCE($1, theme),
           language = COALESCE($2, language),
           notifications = COALESCE($3, notifications),
           auto_save = COALESCE($4, auto_save),
           default_scripture_translation = COALESCE($5, default_scripture_translation),
           updated_at = NOW()
       WHERE user_id = $6
       RETURNING *`,
      [theme, language, notifications, autoSave, defaultScriptureTranslation, req.user.userId]
    );

    console.log('Update result:', result.rows);

    if (result.rows.length === 0) {
      console.log('No settings found for user, creating new entry');
      const newResult = await pool.query(
        `INSERT INTO user_settings (id, user_id, organization_id, theme, language, notifications, auto_save, default_scripture_translation, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          uuidv4(),
          req.user.userId,
          req.user.organizationId,
          theme || 'light',
          language || 'en',
          notifications !== undefined ? notifications : true,
          autoSave !== undefined ? autoSave : true,
          defaultScriptureTranslation
        ]
      );
      return res.json(newResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update user settings error:', err);
    res.status(500).json({ 
      error: 'Failed to update user settings',
      details: err.message 
    });
  }
};

// Get organization settings
const getOrganizationSettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const result = await pool.query(
      `SELECT * FROM organization_settings WHERE organization_id = $1`,
      [req.user.organizationId]
    );

    if (result.rows.length === 0) {
      // Create default organization settings
      const defaultResult = await pool.query(
        `INSERT INTO organization_settings (id, organization_id, api_enabled, maintenance_mode, created_at, updated_at)
         VALUES ($1, $2, true, false, NOW(), NOW())
         RETURNING *`,
        [uuidv4(), req.user.organizationId]
      );
      return res.json(defaultResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get organization settings error:', err);
    res.status(500).json({
      error: 'Failed to fetch organization settings',
      code: 'FETCH_ORG_SETTINGS_FAILED'
    });
  }
};

// Update organization settings
const updateOrganizationSettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const {
      organizationName,
      logo,
      primaryColor,
      secondaryColor,
      ccliId,
      ccliAccount,
      maintenanceMode,
      apiEnabled
    } = req.body;

    const result = await pool.query(
      `UPDATE organization_settings 
       SET organization_name = COALESCE($1, organization_name),
           logo = COALESCE($2, logo),
           primary_color = COALESCE($3, primary_color),
           secondary_color = COALESCE($4, secondary_color),
           ccli_id = COALESCE($5, ccli_id),
           ccli_account = COALESCE($6, ccli_account),
           maintenance_mode = COALESCE($7, maintenance_mode),
           api_enabled = COALESCE($8, api_enabled),
           updated_at = NOW()
       WHERE organization_id = $9
       RETURNING *`,
      [
        organizationName,
        logo,
        primaryColor,
        secondaryColor,
        ccliId,
        ccliAccount,
        maintenanceMode,
        apiEnabled,
        req.user.organizationId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization settings not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update organization settings error:', err);
    res.status(500).json({
      error: 'Failed to update organization settings',
      code: 'UPDATE_ORG_SETTINGS_FAILED'
    });
  }
};

// Get display settings
const getDisplaySettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const result = await pool.query(
      `SELECT * FROM display_settings WHERE organization_id = $1`,
      [req.user.organizationId]
    );

    if (result.rows.length === 0) {
      // Create default display settings
      const defaultResult = await pool.query(
        `INSERT INTO display_settings (id, organization_id, livestream_resolution, recording_resolution, output_count, ndi_enabled, created_at, updated_at)
         VALUES ($1, $2, '1080p', '720p', 1, false, NOW(), NOW())
         RETURNING *`,
        [uuidv4(), req.user.organizationId]
      );
      return res.json(defaultResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get display settings error:', err);
    res.status(500).json({
      error: 'Failed to fetch display settings',
      code: 'FETCH_DISPLAY_SETTINGS_FAILED'
    });
  }
};

// Update display settings
const updateDisplaySettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const {
      mainDisplay,
      stageMonitor,
      livestreamResolution,
      recordingResolution,
      outputCount,
      ndiEnabled,
      ndiNames
    } = req.body;

    const result = await pool.query(
      `UPDATE display_settings 
       SET main_display = COALESCE($1::jsonb, main_display),
           stage_monitor = COALESCE($2::jsonb, stage_monitor),
           livestream_resolution = COALESCE($3, livestream_resolution),
           recording_resolution = COALESCE($4, recording_resolution),
           output_count = COALESCE($5, output_count),
           ndi_enabled = COALESCE($6, ndi_enabled),
           ndi_names = COALESCE($7::jsonb, ndi_names),
           updated_at = NOW()
       WHERE organization_id = $8
       RETURNING *`,
      [
        mainDisplay ? JSON.stringify(mainDisplay) : null,
        stageMonitor ? JSON.stringify(stageMonitor) : null,
        livestreamResolution,
        recordingResolution,
        outputCount,
        ndiEnabled,
        ndiNames ? JSON.stringify(ndiNames) : null,
        req.user.organizationId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Display settings not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update display settings error:', err);
    res.status(500).json({
      error: 'Failed to update display settings',
      code: 'UPDATE_DISPLAY_SETTINGS_FAILED'
    });
  }
};

// Get subscription settings
const getSubscriptionSettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const result = await pool.query(
      `SELECT * FROM subscriptions WHERE organization_id = $1`,
      [req.user.organizationId]
    );

    if (result.rows.length === 0) {
      // Create default subscription
      const defaultResult = await pool.query(
        `INSERT INTO subscriptions (id, organization_id, tier, started_at, created_at, updated_at)
         VALUES ($1, $2, 'free', NOW(), NOW(), NOW())
         RETURNING *`,
        [uuidv4(), req.user.organizationId]
      );
      return res.json(defaultResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get subscription settings error:', err);
    res.status(500).json({
      error: 'Failed to fetch subscription settings',
      code: 'FETCH_SUBSCRIPTION_SETTINGS_FAILED'
    });
  }
};

// Update subscription settings
const updateSubscriptionSettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const { tier, expiresAt, renewalDate, paymentMethod } = req.body;

    const result = await pool.query(
      `UPDATE subscriptions 
       SET tier = COALESCE($1, tier),
           expires_at = COALESCE($2, expires_at),
           renewal_date = COALESCE($3, renewal_date),
           payment_method = COALESCE($4, payment_method),
           updated_at = NOW()
       WHERE organization_id = $5
       RETURNING *`,
      [tier, expiresAt, renewalDate, paymentMethod, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update subscription settings error:', err);
    res.status(500).json({
      error: 'Failed to update subscription settings',
      code: 'UPDATE_SUBSCRIPTION_SETTINGS_FAILED'
    });
  }
};

// Get integration settings
const getIntegrationSettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const result = await pool.query(
      `SELECT * FROM integration_credentials 
       WHERE organization_id = $1
       ORDER BY integration_type ASC`,
      [req.user.organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get integration settings error:', err);
    res.status(500).json({
      error: 'Failed to fetch integration settings',
      code: 'FETCH_INTEGRATION_SETTINGS_FAILED'
    });
  }
};

// Update integration settings
const updateIntegrationSettings = async (req, res, next) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(400).json({
        error: 'User not associated with organization',
        code: 'NO_ORG'
      });
    }

    const { integrationType, credentials, enabled } = req.body;

    const result = await pool.query(
      `INSERT INTO integration_credentials (id, organization_id, integration_type, credentials, enabled, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), NOW())
       ON CONFLICT (organization_id, integration_type) 
       DO UPDATE SET credentials = $4::jsonb, enabled = $5, updated_at = NOW()
       RETURNING *`,
      [
        uuidv4(),
        req.user.organizationId,
        integrationType,
        JSON.stringify(credentials),
        enabled
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update integration settings error:', err);
    res.status(500).json({
      error: 'Failed to update integration settings',
      code: 'UPDATE_INTEGRATION_SETTINGS_FAILED'
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getOrganizationSettings,
  updateOrganizationSettings,
  getDisplaySettings,
  updateDisplaySettings,
  getSubscriptionSettings,
  updateSubscriptionSettings,
  getIntegrationSettings,
  updateIntegrationSettings
};