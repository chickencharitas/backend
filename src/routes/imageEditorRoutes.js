const express = require('express');
const multer = require('multer');
const { editImage } = require('../controllers/imageEditorController');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();
router.post('/edit', upload.single('image'), editImage);

module.exports = router;