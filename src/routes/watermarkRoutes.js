const express = require('express');
const multer = require('multer');
const { addWatermark } = require('../controllers/watermarkController');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();
router.post('/add', upload.single('image'), addWatermark);

module.exports = router;