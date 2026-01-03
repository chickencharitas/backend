const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  // Templates
  getPublicTemplates,
  getTemplateDetails,
  downloadTemplate,
  rateTemplate,
  // Media Library
  getLibraries,
  createLibrary,
  getLibraryItems,
  addLibraryItem,
  deleteLibraryItem,
  // Community
  getCommunityPresentations,
  sharePresentationToComm,
  likePresentationComm,
  ratePresentationComm,
  downloadPresentationComm,
  // Sermon Series
  getSermonSeries,
  createSermonSeries,
  getSermonNotes,
  createSermonNote,
  updateSermonNote,
  deleteSermonNote,
  getSermonSeriesPresets,
  createSermonSeriesPreset,
  deploySermonSeriesPreset
} = require('../controllers/marketplaceController');

const router = express.Router();

// Public routes (no auth required)
router.get('/templates', getPublicTemplates);
router.get('/templates/:template_id', getTemplateDetails);
router.get('/community', getCommunityPresentations);

// Protected routes
router.use(authenticate);

// Template routes
router.post('/templates/:template_id/download', downloadTemplate);
router.post('/templates/:template_id/rate', rateTemplate);

// Media Library routes
router.get('/libraries', getLibraries);
router.post('/libraries', createLibrary);
router.get('/libraries/:library_id/items', getLibraryItems);
router.post('/libraries/:library_id/items', addLibraryItem);
router.delete('/libraries/items/:item_id', deleteLibraryItem);

// Community routes
router.post('/community/share/:presentation_id', sharePresentationToComm);
router.post('/community/:presentation_id/like', likePresentationComm);
router.post('/community/:presentation_id/rate', ratePresentationComm);
router.post('/community/:presentation_id/download', downloadPresentationComm);

// Sermon Series routes
router.get('/sermon-series', getSermonSeries);
router.post('/sermon-series', createSermonSeries);
router.get('/sermon-series/:series_id/notes', getSermonNotes);
router.post('/sermon-series/:series_id/notes', createSermonNote);
router.put('/sermon-notes/:note_id', updateSermonNote);
router.delete('/sermon-notes/:note_id', deleteSermonNote);

// Sermon Series Presets
router.get('/sermon-presets', getSermonSeriesPresets);
router.post('/sermon-presets', createSermonSeriesPreset);
router.post('/sermon-presets/:preset_id/deploy', deploySermonSeriesPreset);

module.exports = router;