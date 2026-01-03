const express = require('express');
const { authenticate } = require('../middleware/auth');
const { startSession, joinSession, endSession } = require('../controllers/collaborativeController');

const router = express.Router();
router.use(authenticate);

router.post('/start', startSession);
router.post('/join', joinSession);
router.post('/end', endSession);

module.exports = router;