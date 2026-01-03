const express = require('express');
const router = express.Router();

// TODO: Implement notification routes
router.get('/', (req, res) => {
  res.json({ message: 'Notifications endpoint' });
});

module.exports = router;