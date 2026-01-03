const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

ffmpeg.setFfmpegPath(ffmpegPath);

// ============================================================
// BASIC AUDIO MIXING
// ============================================================

const mixAudio = async (req, res) => {
  try {
    const { audio1, audio2, volume1 = 1, volume2 = 1 } = req.body;
    const organizationId = req.user.organizationId;
    
    if (!req.files || !req.files.audio1 || !req.files.audio2) {
      return res.status(400).json({ error: 'Two audio files required' });
    }

    const outputFilename = `mixed_${Date.now()}.mp3`;
    const outputPath = path.join('uploads', 'audio', outputFilename);

    // Ensure output directory exists
    if (!fs.existsSync(path.join('uploads', 'audio'))) {
      fs.mkdirSync(path.join('uploads', 'audio'), { recursive: true });
    }

    ffmpeg()
      .input(req.files.audio1[0].path)
      .input(req.files.audio2[0].path)
      .complexFilter([
        `[0:a]volume=${volume1}[a1]`,
        `[1:a]volume=${volume2}[a2]`,
        `[a1][a2]amix=inputs=2:duration=longest[aout]`
      ], 'aout')
      .output(outputPath)
      .on('end', async () => {
        // Save mix session to database
        const mixResult = await pool.query(
          `INSERT INTO audio_mixes (organization_id, name, input_files, output_file, mix_type, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [organizationId, outputFilename, JSON.stringify([req.files.audio1[0].filename, req.files.audio2[0].filename]), outputFilename, 'basic_mix', req.user.userId]
        );

        res.json({
          success: true,
          mixId: mixResult.rows[0].id,
          url: `/uploads/audio/${outputFilename}`,
          message: 'Audio mixed successfully'
        });
      })
      .on('error', err => {
        console.error('Audio mix error:', err);
        res.status(500).json({ error: 'Audio mix failed', details: err.message });
      })
      .run();
  } catch (err) {
    console.error('Error in mixAudio:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// ADVANCED MIXING WITH EQ & EFFECTS
// ============================================================

const mixAudioWithEffects = async (req, res) => {
  try {
    const { files, effects = {} } = req.body;
    const organizationId = req.user.organizationId;

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 audio files required' });
    }

    const outputFilename = `mix_effects_${Date.now()}.mp3`;
    const outputPath = path.join('uploads', 'audio', outputFilename);

    let complexFilter = [];
    let filterChain = '';

    // Build complex filter with EQ and effects
    req.files.forEach((file, idx) => {
      const volume = effects[idx]?.volume || 1;
      const bass = effects[idx]?.bass || 0;
      const treble = effects[idx]?.treble || 0;
      const reverb = effects[idx]?.reverb || 0;

      let filter = `[${idx}:a]`;
      filter += `volume=${volume}`;

      if (bass !== 0 || treble !== 0) {
        filter += `,equalizer=cchn=FC:t=h:width_type=o:width=2:g=${treble}`;
        filter += `,equalizer=cchn=FC:t=l:width_type=o:width=2:g=${bass}`;
      }

      if (reverb > 0) {
        filter += `,aecho=0.8:0.9:${reverb * 1000}:0.3`;
      }

      filter += `[a${idx}]`;
      complexFilter.push(filter);
    });

    // Mix all tracks
    const mixInputs = req.files.map((_, idx) => `[a${idx}]`).join('');
    complexFilter.push(`${mixInputs}amix=inputs=${req.files.length}:duration=longest[aout]`);

    ffmpeg()
      .input(req.files[0].path)
      .input(req.files[1].path)
      .complexFilter(complexFilter, 'aout')
      .output(outputPath)
      .on('end', async () => {
        const mixResult = await pool.query(
          `INSERT INTO audio_mixes (organization_id, name, input_files, output_file, mix_type, effects_applied, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [organizationId, outputFilename, JSON.stringify(req.files.map(f => f.filename)), outputFilename, 'effects_mix', JSON.stringify(effects), req.user.userId]
        );

        res.json({
          success: true,
          mixId: mixResult.rows[0].id,
          url: `/uploads/audio/${outputFilename}`,
          message: 'Audio mixed with effects successfully'
        });
      })
      .on('error', err => {
        console.error('Error:', err);
        res.status(500).json({ error: 'Mixing failed', details: err.message });
      })
      .run();
  } catch (err) {
    console.error('Error in mixAudioWithEffects:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// MULTITRACK MIXING (3+ tracks)
// ============================================================

const mixMultitrack = async (req, res) => {
  try {
    const { trackSettings = {} } = req.body;
    const organizationId = req.user.organizationId;

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 audio files required' });
    }

    const outputFilename = `multitrack_${Date.now()}.mp3`;
    const outputPath = path.join('uploads', 'audio', outputFilename);

    let ffmpegCmd = ffmpeg();
    let complexFilter = [];

    // Add all input files
    req.files.forEach((file, idx) => {
      ffmpegCmd = ffmpegCmd.input(file.path);
    });

    // Build filter chain for each track
    req.files.forEach((file, idx) => {
      const settings = trackSettings[idx] || {};
      const volume = settings.volume || 1;
      const pan = settings.pan || 0; // -1 (left) to 1 (right)
      const delay = settings.delay || 0; // ms
      const mute = settings.mute ? 0 : 1;

      let filter = `[${idx}:a]`;
      
      if (delay > 0) {
        filter += `adelay=${delay}|${delay},`;
      }

      filter += `volume=${volume * mute}`;

      if (Math.abs(pan) > 0.01) {
        filter += `,pan=stereo|FL<FL+${(1-pan)/2}*FR|FR<FR+${(1+pan)/2}*FL`;
      }

      filter += `[a${idx}]`;
      complexFilter.push(filter);
    });

    // Mix all tracks
    const mixInputs = req.files.map((_, idx) => `[a${idx}]`).join('');
    complexFilter.push(`${mixInputs}amix=inputs=${req.files.length}:duration=longest[aout]`);

    ffmpegCmd
      .complexFilter(complexFilter, 'aout')
      .output(outputPath)
      .on('end', async () => {
        const mixResult = await pool.query(
          `INSERT INTO audio_mixes (organization_id, name, input_files, output_file, mix_type, track_settings, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [organizationId, outputFilename, JSON.stringify(req.files.map(f => f.filename)), outputFilename, 'multitrack', JSON.stringify(trackSettings), req.user.userId]
        );

        res.json({
          success: true,
          mixId: mixResult.rows[0].id,
          url: `/uploads/audio/${outputFilename}`,
          message: 'Multitrack mix created successfully'
        });
      })
      .on('error', err => {
        console.error('Multitrack mix error:', err);
        res.status(500).json({ error: 'Multitrack mixing failed', details: err.message });
      })
      .run();
  } catch (err) {
    console.error('Error in mixMultitrack:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// AUDIO DUCKING (e.g., background music under vocals)
// ============================================================

const audioducking = async (req, res) => {
  try {
    const { vocalTrack, backgroundTrack, duckingAmount = 0.3 } = req.body;
    const organizationId = req.user.organizationId;

    if (!req.files || !req.files[0] || !req.files[1]) {
      return res.status(400).json({ error: 'Vocal and background tracks required' });
    }

    const outputFilename = `ducked_${Date.now()}.mp3`;
    const outputPath = path.join('uploads', 'audio', outputFilename);

    ffmpeg()
      .input(req.files[0].path) // vocal
      .input(req.files[1].path) // background
      .complexFilter([
        `[0:a]aformat=sample_rates=48000[vocal]`,
        `[1:a]aformat=sample_rates=48000[bg]`,
        `[vocal][bg]sidechaincompress=threshold=0.003:ratio=4[compressed_bg]`,
        `[vocal][compressed_bg]amix=inputs=2:duration=longest[aout]`
      ], 'aout')
      .output(outputPath)
      .on('end', async () => {
        const mixResult = await pool.query(
          `INSERT INTO audio_mixes (organization_id, name, input_files, output_file, mix_type, ducking_amount, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [organizationId, outputFilename, JSON.stringify(['vocal', 'background']), outputFilename, 'ducking', duckingAmount, req.user.userId]
        );

        res.json({
          success: true,
          mixId: mixResult.rows[0].id,
          url: `/uploads/audio/${outputFilename}`,
          message: 'Audio ducking applied successfully'
        });
      })
      .on('error', err => {
        console.error('Audio ducking error:', err);
        res.status(500).json({ error: 'Ducking failed', details: err.message });
      })
      .run();
  } catch (err) {
    console.error('Error in audioducking:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// NORMALIZATION & LOUDNESS CONTROL
// ============================================================

const normalizeAudio = async (req, res) => {
  try {
    const { targetLoudness = -16, method = 'lufs' } = req.body;
    const organizationId = req.user.organizationId;

    if (!req.files || !req.files[0]) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    const outputFilename = `normalized_${Date.now()}.mp3`;
    const outputPath = path.join('uploads', 'audio', outputFilename);

    ffmpeg()
      .input(req.files[0].path)
      .audioFilter('loudnorm=I=-16:TP=-1.5:LRA=11')
      .output(outputPath)
      .on('end', async () => {
        const mixResult = await pool.query(
          `INSERT INTO audio_mixes (organization_id, name, input_files, output_file, mix_type, target_loudness, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [organizationId, outputFilename, JSON.stringify([req.files[0].filename]), outputFilename, 'normalization', targetLoudness, req.user.userId]
        );

        res.json({
          success: true,
          mixId: mixResult.rows[0].id,
          url: `/uploads/audio/${outputFilename}`,
          message: 'Audio normalized successfully'
        });
      })
      .on('error', err => {
        console.error('Normalization error:', err);
        res.status(500).json({ error: 'Normalization failed', details: err.message });
      })
      .run();
  } catch (err) {
    console.error('Error in normalizeAudio:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET AUDIO ANALYSIS
// ============================================================

const analyzeAudio = async (req, res) => {
  try {
    const { audioFile } = req.body;
    const organizationId = req.user.organizationId;

    if (!req.files || !req.files[0]) {
      return res.status(400).json({ error: 'Audio file required' });
    }

    ffmpeg(req.files[0].path)
      .ffprobe((err, data) => {
        if (err) {
          return res.status(500).json({ error: 'Analysis failed', details: err.message });
        }

        const audioStream = data.streams.find(s => s.codec_type === 'audio');

        res.json({
          duration: data.format.duration,
          bitRate: audioStream.bit_rate,
          sampleRate: audioStream.sample_rate,
          channels: audioStream.channels,
          codec: audioStream.codec_name,
          format: data.format.format_name
        });
      });
  } catch (err) {
    console.error('Error in analyzeAudio:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// GET MIX HISTORY
// ============================================================

const getMixHistory = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT am.*, u.first_name, u.last_name
       FROM audio_mixes am
       LEFT JOIN users u ON am.created_by = u.id
       WHERE am.organization_id = $1
       ORDER BY am.created_at DESC
       LIMIT 50`,
      [organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching mix history:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// DELETE MIX
// ============================================================

const deleteMix = async (req, res) => {
  try {
    const { mixId } = req.params;
    const organizationId = req.user.organizationId;

    const mixResult = await pool.query(
      `SELECT output_file FROM audio_mixes WHERE id = $1 AND organization_id = $2`,
      [mixId, organizationId]
    );

    if (mixResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mix not found' });
    }

    // Delete file from disk
    const filePath = path.join('uploads', 'audio', mixResult.rows[0].output_file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await pool.query('DELETE FROM audio_mixes WHERE id = $1', [mixId]);

    res.json({ message: 'Mix deleted successfully' });
  } catch (err) {
    console.error('Error deleting mix:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  mixAudio,
  mixAudioWithEffects,
  mixMultitrack,
  audioducking,
  normalizeAudio,
  analyzeAudio,
  getMixHistory,
  deleteMix
};