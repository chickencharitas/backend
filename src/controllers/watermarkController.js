const sharp = require('sharp');
const path = require('path');

exports.addWatermark = async (req, res) => {
  try {
    const inputPath = req.file.path;
    const watermarkPath = req.body.watermarkPath; // Path to watermark image
    const outputPath = path.join('uploads', 'watermarked_' + req.file.filename);

    const image = sharp(inputPath)
      .composite([{ input: watermarkPath, gravity: 'southeast' }]);

    await image.toFile(outputPath);

    res.json({ url: outputPath });
  } catch (err) {
    res.status(500).json({ error: 'Watermark failed', details: err.message });
  }
};