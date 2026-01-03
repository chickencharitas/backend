const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

exports.trimVideo = (req, res) => {
  const { start, end } = req.body; // seconds
  const inputPath = req.file.path;
  const outputPath = path.join('uploads', 'trimmed_' + req.file.filename);

  ffmpeg(inputPath)
    .setStartTime(start)
    .setDuration(end - start)
    .output(outputPath)
    .on('end', () => res.json({ url: outputPath }))
    .on('error', err => res.status(500).json({ error: 'Video trim failed', details: err.message }))
    .run();
};