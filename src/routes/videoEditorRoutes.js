const express = require('express');
const multer = require('multer');
const { trimVideo } = require('../controllers/videoEditorController');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();
router.post('/trim', upload.single('video'), trimVideo);

module.exports = router;