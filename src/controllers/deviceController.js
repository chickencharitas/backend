const { pool } = require('../config/database');

// ============================================================
// CAMERA DEVICES
// ============================================================
exports.getCameraDevices = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    const result = await pool.query(
      `SELECT * FROM camera_devices WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addCameraDevice = async (req, res) => {
  try {
    const { name, model, ip_address, port, protocol, username, password } = req.body;
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `INSERT INTO camera_devices (organization_id, name, model, ip_address, port, protocol, username, password) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [organization_id, name, model, ip_address, port || 5678, protocol, username, password]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCameraPresets = async (req, res) => {
  try {
    const { camera_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM camera_presets WHERE camera_id = $1 ORDER BY preset_name`,
      [camera_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveCameraPreset = async (req, res) => {
  try {
    const { camera_id } = req.params;
    const { preset_name, pan_position, tilt_position, zoom_position, focus_position, iris_position } = req.body;

    const result = await pool.query(
      `INSERT INTO camera_presets (camera_id, preset_name, pan_position, tilt_position, zoom_position, focus_position, iris_position)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (camera_id, preset_name) DO UPDATE SET
       pan_position = $3, tilt_position = $4, zoom_position = $5, focus_position = $6, iris_position = $7
       RETURNING *`,
      [camera_id, preset_name, pan_position, tilt_position, zoom_position, focus_position, iris_position]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.recallCameraPreset = async (req, res) => {
  try {
    const { preset_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM camera_presets WHERE id = $1`,
      [preset_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.moveCameraAbsolute = async (req, res) => {
  try {
    const { camera_id } = req.params;
    const { pan_position, tilt_position, zoom_position } = req.body;

    await pool.query(
      `INSERT INTO camera_movements (camera_id, pan_value, tilt_value, zoom_value)
       VALUES ($1, $2, $3, $4)`,
      [camera_id, pan_position, tilt_position, zoom_position]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.moveCameraRelative = async (req, res) => {
  try {
    const { camera_id } = req.params;
    const { pan_speed, tilt_speed, zoom_speed } = req.body;

    await pool.query(
      `INSERT INTO camera_movements (camera_id, pan_speed, tilt_speed, zoom_speed)
       VALUES ($1, $2, $3, $4)`,
      [camera_id, pan_speed, tilt_speed, zoom_speed]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCameraDevice = async (req, res) => {
  try {
    const { camera_id } = req.params;
    await pool.query(
      `DELETE FROM camera_devices WHERE id = $1`,
      [camera_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCameraDevice = async (req, res) => {
  try {
    const { camera_id } = req.params;
    const { name, model, ip_address, port, protocol, username, password } = req.body;
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `UPDATE camera_devices SET name = $1, model = $2, ip_address = $3, port = $4, protocol = $5, username = $6, password = $7, updated_at = NOW()
       WHERE id = $8 AND organization_id = $9 RETURNING *`,
      [name, model, ip_address, port, protocol, username, password, camera_id, organization_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Camera not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// DMX LIGHTING CONTROL
// ============================================================
exports.getDMXControllers = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    const result = await pool.query(
      `SELECT * FROM dmx_controllers WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addDMXController = async (req, res) => {
  try {
    const { name, model, ip_address, usb_port, connection_type, universes_count } = req.body;
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `INSERT INTO dmx_controllers (organization_id, name, model, ip_address, usb_port, connection_type, universes_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [organization_id, name, model, ip_address, usb_port, connection_type, universes_count]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDMXFixtures = async (req, res) => {
  try {
    const { controller_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM dmx_fixtures WHERE dmx_controller_id = $1 ORDER BY universe, start_channel`,
      [controller_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addDMXFixture = async (req, res) => {
  try {
    const { controller_id } = req.params;
    const { fixture_name, fixture_type, universe, start_channel, channel_count, mode } = req.body;

    const result = await pool.query(
      `INSERT INTO dmx_fixtures (dmx_controller_id, fixture_name, fixture_type, universe, start_channel, channel_count, mode)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [controller_id, fixture_name, fixture_type, universe, start_channel, channel_count, mode]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDMXScenes = async (req, res) => {
  try {
    const { controller_id } = req.params;
    const result = await pool.query(
      `SELECT ds.*, u.firstName, u.lastName FROM dmx_scenes ds
       LEFT JOIN users u ON ds.created_by = u.id
       WHERE ds.dmx_controller_id = $1 ORDER BY ds.created_at DESC`,
      [controller_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDMXScene = async (req, res) => {
  try {
    const { controller_id } = req.params;
    const { scene_name, description, fade_time_ms } = req.body;
    const created_by = req.user.userId;

    const result = await pool.query(
      `INSERT INTO dmx_scenes (dmx_controller_id, scene_name, description, fade_time_ms, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [controller_id, scene_name, description, fade_time_ms, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setDMXSceneData = async (req, res) => {
  try {
    const { scene_id } = req.params;
    const { fixture_id, channel_data } = req.body;

    const result = await pool.query(
      `INSERT INTO dmx_scene_data (scene_id, fixture_id, channel_data)
       VALUES ($1, $2, $3)
       ON CONFLICT (scene_id, fixture_id) DO UPDATE SET channel_data = $3
       RETURNING *`,
      [scene_id, fixture_id, Buffer.from(channel_data)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDMXSceneData = async (req, res) => {
  try {
    const { scene_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM dmx_scene_data WHERE scene_id = $1`,
      [scene_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// AUDIO MIXER CONTROL
// ============================================================
exports.getAudioMixers = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    const result = await pool.query(
      `SELECT * FROM audio_mixers WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAudioMixer = async (req, res) => {
  try {
    const { name, model, ip_address, port, protocol } = req.body;
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `INSERT INTO audio_mixers (organization_id, name, model, ip_address, port, protocol)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [organization_id, name, model, ip_address, port || 9000, protocol]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMixerChannels = async (req, res) => {
  try {
    const { mixer_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM mixer_channels WHERE mixer_id = $1 ORDER BY channel_number`,
      [mixer_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.setChannelLevel = async (req, res) => {
  try {
    const { channel_id } = req.params;
    const { level_db, mute, pan, solo } = req.body;

    await pool.query(
      `INSERT INTO mixer_faders (channel_id, level_db, mute, pan, solo)
       VALUES ($1, $2, $3, $4, $5)`,
      [channel_id, level_db, mute, pan, solo]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMixerScenes = async (req, res) => {
  try {
    const { mixer_id } = req.params;
    const result = await pool.query(
      `SELECT ms.*, u.firstName, u.lastName FROM mixer_scenes ms
       LEFT JOIN users u ON ms.created_by = u.id
       WHERE ms.mixer_id = $1 ORDER BY ms.created_at DESC`,
      [mixer_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMixerScene = async (req, res) => {
  try {
    const { mixer_id } = req.params;
    const { scene_name, description, fade_time_ms } = req.body;
    const created_by = req.user.userId;

    const result = await pool.query(
      `INSERT INTO mixer_scenes (mixer_id, scene_name, description, fade_time_ms, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [mixer_id, scene_name, description, fade_time_ms, created_by]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.saveMixerSceneSettings = async (req, res) => {
  try {
    const { scene_id } = req.params;
    const { channel_settings } = req.body;

    for (const setting of channel_settings) {
      await pool.query(
        `INSERT INTO mixer_scene_settings (scene_id, channel_id, fader_level, mute, pan)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (scene_id, channel_id) DO UPDATE SET
         fader_level = $3, mute = $4, pan = $5`,
        [scene_id, setting.channel_id, setting.fader_level, setting.mute, setting.pan]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// VIDEO ROUTER CONTROL
// ============================================================
exports.getVideoRouters = async (req, res) => {
  try {
    const organization_id = req.user.organizationId;
    const result = await pool.query(
      `SELECT * FROM video_routers WHERE organization_id = $1 ORDER BY created_at DESC`,
      [organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addVideoRouter = async (req, res) => {
  try {
    const { name, model, ip_address, port, protocol, input_count, output_count } = req.body;
    const organization_id = req.user.organizationId;

    const result = await pool.query(
      `INSERT INTO video_routers (organization_id, name, model, ip_address, port, protocol, input_count, output_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [organization_id, name, model, ip_address, port, protocol, input_count, output_count]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRouterInputs = async (req, res) => {
  try {
    const { router_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM router_inputs WHERE router_id = $1 ORDER BY input_number`,
      [router_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRouterOutputs = async (req, res) => {
  try {
    const { router_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM router_outputs WHERE router_id = $1 ORDER BY output_number`,
      [router_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.routeVideo = async (req, res) => {
  try {
    const { router_id } = req.params;
    const { input_id, output_id } = req.body;
    const created_by = req.user.userId;

    // Get input and output numbers
    const input = await pool.query(`SELECT input_number FROM router_inputs WHERE id = $1`, [input_id]);
    const output = await pool.query(`SELECT output_number FROM router_outputs WHERE id = $1`, [output_id]);

    if (input.rows.length === 0 || output.rows.length === 0) {
      return res.status(404).json({ error: 'Input or output not found' });
    }

    // Record the route
    await pool.query(
      `INSERT INTO router_routes (router_id, input_id, output_id, created_by)
       VALUES ($1, $2, $3, $4)`,
      [router_id, input_id, output_id, created_by]
    );

    // Update output to point to this input
    await pool.query(
      `UPDATE router_outputs SET current_input = $1 WHERE id = $2`,
      [input.rows[0].input_number, output_id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRouterPresets = async (req, res) => {
  try {
    const { router_id } = req.params;
    const result = await pool.query(
      `SELECT rp.*, u.firstName, u.lastName FROM router_presets rp
       LEFT JOIN users u ON rp.created_by = u.id
       WHERE rp.router_id = $1 ORDER BY rp.created_at DESC`,
      [router_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRouterPreset = async (req, res) => {
  try {
    const { router_id } = req.params;
    const { preset_name, description, routes } = req.body;
    const created_by = req.user.userId;

    const result = await pool.query(
      `INSERT INTO router_presets (router_id, preset_name, description, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [router_id, preset_name, description, created_by]
    );

    const preset_id = result.rows[0].id;

    // Store routes
    for (const route of routes) {
      await pool.query(
        `INSERT INTO router_preset_routes (preset_id, output_number, input_number)
         VALUES ($1, $2, $3)`,
        [preset_id, route.output_number, route.input_number]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.applyRouterPreset = async (req, res) => {
  try {
    const { preset_id } = req.params;

    const preset = await pool.query(`SELECT * FROM router_presets WHERE id = $1`, [preset_id]);
    if (preset.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    const routes = await pool.query(
      `SELECT * FROM router_preset_routes WHERE preset_id = $1`,
      [preset_id]
    );

    res.json(routes.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};