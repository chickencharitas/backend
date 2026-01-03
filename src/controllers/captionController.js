const { pool } = require('../config/database');
const axios = require('axios');

// ============================================================
// SPEECH-TO-TEXT / TRANSCRIPTION
// ============================================================

const startTranscription = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const organizationId = req.user.organizationId;

    // Get media file
    const mediaResult = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [mediaId, organizationId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const media = mediaResult.rows[0];

    // Create transcription record
    const transcResult = await pool.query(
      `INSERT INTO transcriptions (media_id, organization_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [mediaId, organizationId]
    );

    const transcription = transcResult.rows[0];

    // Trigger async processing
    processTranscription(transcription.id, media.path);

    res.json({
      transcriptionId: transcription.id,
      status: 'pending',
      message: 'Transcription started'
    });
  } catch (err) {
    console.error('Error starting transcription:', err);
    res.status(500).json({ error: err.message });
  }
};

const getTranscription = async (req, res) => {
  try {
    const { transcriptionId } = req.params;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT t.*, COUNT(DISTINCT c.id) as caption_count
       FROM transcriptions t
       LEFT JOIN captions c ON t.id = c.transcription_id
       WHERE t.id = $1 AND t.organization_id = $2
       GROUP BY t.id`,
      [transcriptionId, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching transcription:', err);
    res.status(500).json({ error: err.message });
  }
};

const getCaptions = async (req, res) => {
  try {
    const { transcriptionId } = req.params;
    const organizationId = req.user.organizationId;

    // Verify transcription belongs to org
    await pool.query(
      `SELECT 1 FROM transcriptions WHERE id = $1 AND organization_id = $2`,
      [transcriptionId, organizationId]
    );

    const result = await pool.query(
      `SELECT * FROM captions 
       WHERE transcription_id = $1
       ORDER BY start_time ASC`,
      [transcriptionId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching captions:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// LYRICS DETECTION
// ============================================================

const detectLyrics = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const organizationId = req.user.organizationId;

    const mediaResult = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [mediaId, organizationId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const detected = {
      lyrics: 'Sample detected lyrics...',
      confidence: 0.85,
      source: 'genius'
    };

    const result = await pool.query(
      `INSERT INTO lyrics_suggestions (media_id, detected_lyrics, confidence_score, source)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [mediaId, detected.lyrics, detected.confidence, detected.source]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error detecting lyrics:', err);
    res.status(500).json({ error: err.message });
  }
};

const getLyricsSuggestions = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT ls.*, s.title as song_title, s.artist
       FROM lyrics_suggestions ls
       LEFT JOIN songs s ON ls.song_id = s.id
       WHERE ls.media_id = $1 AND ls.media_id IN (
         SELECT id FROM media WHERE organization_id = $2
       )
       ORDER BY ls.confidence_score DESC`,
      [mediaId, organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching lyrics suggestions:', err);
    res.status(500).json({ error: err.message });
  }
};

const approveLyrics = async (req, res) => {
  try {
    const { lyricId } = req.params;
    const { songId } = req.body;

    const result = await pool.query(
      `UPDATE lyrics_suggestions 
       SET is_approved = true, song_id = $1
       WHERE id = $2
       RETURNING *`,
      [songId, lyricId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error approving lyrics:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// IMAGE RECOGNITION
// ============================================================

const analyzeImages = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const organizationId = req.user.organizationId;

    const mediaResult = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [mediaId, organizationId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const analysis = {
      objects: [
        { label: 'person', confidence: 0.98 },
        { label: 'microphone', confidence: 0.92 }
      ],
      text: 'Sample detected text',
      description: 'A person speaking at a microphone'
    };

    const result = await pool.query(
      `INSERT INTO image_recognition (media_id, detected_objects, detected_text, scene_description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [mediaId, JSON.stringify(analysis.objects), analysis.text, analysis.description]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error analyzing images:', err);
    res.status(500).json({ error: err.message });
  }
};

const getImageAnalysis = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT * FROM image_recognition
       WHERE media_id = $1 AND media_id IN (
         SELECT id FROM media WHERE organization_id = $2
       )
       ORDER BY timestamp ASC`,
      [mediaId, organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching image analysis:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// SMART CUE POINTS
// ============================================================

const generateCuepoints = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const organizationId = req.user.organizationId;

    const mediaResult = await pool.query(
      'SELECT * FROM media WHERE id = $1 AND organization_id = $2',
      [mediaId, organizationId]
    );

    if (mediaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const cuepoints = [
      { timestamp: 0, type: 'scene_change', description: 'Start', confidence: 1.0 },
      { timestamp: 5000, type: 'speaker_change', description: 'Speaker changes', confidence: 0.92 },
      { timestamp: 15000, type: 'music_beat', description: 'Music peak', confidence: 0.88 }
    ];

    const results = [];
    for (const cue of cuepoints) {
      const result = await pool.query(
        `INSERT INTO smart_cuepoints (media_id, timestamp, cue_type, description, confidence, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [mediaId, cue.timestamp, cue.type, cue.description, cue.confidence, req.user.userId]
      );
      results.push(result.rows[0]);
    }

    res.json(results);
  } catch (err) {
    console.error('Error generating cue points:', err);
    res.status(500).json({ error: err.message });
  }
};

const getCuepoints = async (req, res) => {
  try {
    const { mediaId } = req.params;
    const organizationId = req.user.organizationId;

    const result = await pool.query(
      `SELECT sc.*, u.first_name, u.last_name
       FROM smart_cuepoints sc
       LEFT JOIN users u ON sc.created_by = u.id
       WHERE sc.media_id = $1 AND sc.media_id IN (
         SELECT id FROM media WHERE organization_id = $2
       )
       ORDER BY sc.timestamp ASC`,
      [mediaId, organizationId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cue points:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateCuepoint = async (req, res) => {
  try {
    const { cuepointId } = req.params;
    const { description, timestamp } = req.body;

    const result = await pool.query(
      `UPDATE smart_cuepoints 
       SET description = $1, timestamp = $2
       WHERE id = $3
       RETURNING *`,
      [description, timestamp, cuepointId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating cue point:', err);
    res.status(500).json({ error: err.message });
  }
};

const deleteCuepoint = async (req, res) => {
  try {
    const { cuepointId } = req.params;

    await pool.query('DELETE FROM smart_cuepoints WHERE id = $1', [cuepointId]);

    res.json({ message: 'Cue point deleted' });
  } catch (err) {
    console.error('Error deleting cue point:', err);
    res.status(500).json({ error: err.message });
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function processTranscription(transcriptionId, mediaPath) {
  try {
    await pool.query(
      `UPDATE transcriptions 
       SET status = 'processing', processing_started_at = NOW()
       WHERE id = $1`,
      [transcriptionId]
    );

    // Simulate processing
    setTimeout(async () => {
      const sampleTranscript = 'Sample transcription text from the media file...';

      await pool.query(
        `UPDATE transcriptions 
         SET status = 'completed', transcript_text = $1, processing_completed_at = NOW()
         WHERE id = $2`,
        [sampleTranscript, transcriptionId]
      );

      // Create sample captions
      await pool.query(
        `INSERT INTO captions (transcription_id, media_id, start_time, end_time, text)
         VALUES ($1, (SELECT media_id FROM transcriptions WHERE id = $2), 0, 3000, 'Sample transcription text from the media file...')`,
        [transcriptionId, transcriptionId]
      );
    }, 2000);
  } catch (err) {
    console.error('Error processing transcription:', err);
    await pool.query(
      `UPDATE transcriptions 
       SET status = 'failed', error_message = $1
       WHERE id = $2`,
      [err.message, transcriptionId]
    );
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  startTranscription,
  getTranscription,
  getCaptions,
  detectLyrics,
  getLyricsSuggestions,
  approveLyrics,
  analyzeImages,
  getImageAnalysis,
  generateCuepoints,
  getCuepoints,
  updateCuepoint,
  deleteCuepoint,
  processTranscription
};