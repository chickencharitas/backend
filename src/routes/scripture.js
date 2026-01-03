const express = require('express');
const router = express.Router();
const {
  searchScripture,
  getVerses,
  getScriptureBooks,
  addCustomVerse,
  getScriptureTranslations,
  setDefaultTranslation
} = require('../controllers/scriptureController');

router.get('/search', searchScripture);
router.get('/verses/:book/:chapter', getVerses);
router.get('/books', getScriptureBooks);
router.get('/translations', getScriptureTranslations);
router.post('/custom', addCustomVerse);
router. post('/default-translation', setDefaultTranslation);

module.exports = router;