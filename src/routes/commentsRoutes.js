const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getComments,
  addComment,
  deleteComment,
  updateComment
} = require('../controllers/commentsController');

const router = express.Router();
router.use(authenticate);

// Media comments
router.get('/media/:mediaId', getComments);
router.post('/media/:mediaId', addComment);

// Comment actions
router.put('/:commentId', updateComment);
router.delete('/:commentId', deleteComment);

module.exports = router;
