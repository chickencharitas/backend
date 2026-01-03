const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requestApproval, respondApproval, getApprovals } = require('../controllers/approvalController');

const router = express.Router();
router.use(authenticate);

router.post('/request', requestApproval);
router.post('/respond', respondApproval);
router.get('/:media_id', getApprovals);

module.exports = router;