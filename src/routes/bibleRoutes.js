/**
 * Bible Routes
 * Endpoints for Bible verse lookups and management
 */

const express = require('express');
const router = express.Router();
const bibleController = require('../controllers/bibleController');

// Public endpoints - no authentication required
router.get('/search', bibleController.searchVerse);
router.get('/versions', bibleController.getVersions);
router.get('/books', bibleController.getBooks);

// Favorites endpoints (optional auth support)
router.post('/favorites', bibleController.addFavorite);
router.get('/favorites', bibleController.getFavorites);

// Install Bible version (premium/paid)
router.post('/install-version', bibleController.installVersion);

module.exports = router;
