const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

exports.editImage = async (req, res) => {
  try {
    const { action, value } = req.body; // e.g. { action: 'resize', value: { width: 400, height: 300 } }
    const inputPath = req.file.path;
    let image = sharp(inputPath);

    if (action === 'resize') {
      image = image.resize(value.width, value.height);
    }
    // Add more actions: crop, rotate, etc.

    const outputPath = path.join('uploads', 'edited_' + req.file.filename);
    await image.toFile(outputPath);

    res.json({ url: outputPath });
  } catch (err) {
    res.status(500).json({ error: 'Image edit failed', details: err.message });
  }
};
