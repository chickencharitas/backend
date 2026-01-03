const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const {
  createPresentation,
  getPresentation,
  getPresentations,
  updatePresentation,
  deletePresentation,
  addSlide,
  updateSlide,
  deleteSlide,
  duplicatePresentation,
  importPowerPoint,
  // Live presentation control
  startLivePresentation,
  endLivePresentation,
  getLivePresentation,
  updateLiveSlide,
  // Slide formatting
  updateSlideFormatting,
  getSlideFormatting,
  // Cues and hotkeys
  createCue,
  getCues,
  updateCue,
  deleteCue,
  // Slide notes for stage monitor
  updateSlideNotes,
  getSlideNotes,
  // Display profiles
  getDisplayProfiles,
  updateDisplayProfile
} = require('../controllers/presentationController');

router.post('/', rbac([PERMISSIONS.CREATE_PRESENTATION]), createPresentation);
router.get('/', getPresentations);
router.get('/:id', getPresentation);
router.put('/:id', rbac([PERMISSIONS. EDIT_PRESENTATION]), updatePresentation);
router.delete('/:id', rbac([PERMISSIONS.DELETE_PRESENTATION]), deletePresentation);
router.post('/:id/duplicate', rbac([PERMISSIONS.CREATE_PRESENTATION]), duplicatePresentation);
router.post('/:id/import-powerpoint', rbac([PERMISSIONS.CREATE_PRESENTATION]), importPowerPoint);

router.post('/:id/slides', rbac([PERMISSIONS. EDIT_PRESENTATION]), addSlide);
router.put('/:id/slides/:slideId', rbac([PERMISSIONS.EDIT_PRESENTATION]), updateSlide);
router.delete('/:id/slides/:slideId', rbac([PERMISSIONS. EDIT_PRESENTATION]), deleteSlide);

// Live presentation control
router.post('/:presentationId/live/start', rbac([PERMISSIONS.EDIT_PRESENTATION]), startLivePresentation);
router.post('/:presentationId/live/end', rbac([PERMISSIONS.EDIT_PRESENTATION]), endLivePresentation);
router.get('/:presentationId/live', getLivePresentation);
router.put('/:presentationId/live/slide', rbac([PERMISSIONS.EDIT_PRESENTATION]), updateLiveSlide);

// Slide formatting
router.put('/:id/slides/:slideId/formatting', rbac([PERMISSIONS.EDIT_PRESENTATION]), updateSlideFormatting);
router.get('/:id/slides/:slideId/formatting', getSlideFormatting);

// Cues and hotkeys
router.post('/:id/cues', rbac([PERMISSIONS.EDIT_PRESENTATION]), createCue);
router.get('/:id/cues', getCues);
router.put('/:id/cues/:cueId', rbac([PERMISSIONS.EDIT_PRESENTATION]), updateCue);
router.delete('/:id/cues/:cueId', rbac([PERMISSIONS.EDIT_PRESENTATION]), deleteCue);

// Slide notes for stage monitor
router.put('/:id/slides/:slideId/notes', rbac([PERMISSIONS.EDIT_PRESENTATION]), updateSlideNotes);
router.get('/:id/slides/:slideId/notes', getSlideNotes);

// Display profiles
router.get('/display-profiles', getDisplayProfiles);
router.put('/display-profiles/:profileId', rbac([PERMISSIONS.MANAGE_SETTINGS]), updateDisplayProfile);

module.exports = router;