const express = require('express');
const { authenticate } = require('../middleware/auth');
const { addVersion, getVersions } = require('../controllers/versionController');

const router = express.Router();
router.use(authenticate);

router.post('/add', addVersion);
router.get('/:media_id', getVersions);

module.exports = router;