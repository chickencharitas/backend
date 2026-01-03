const express = require('express');
const router = express.Router();
const rbac = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const {
  createPlaylist,
  getPlaylist,
  getPlaylists,
  updatePlaylist,
  deletePlaylist,
  addPlaylistItem,
  removePlaylistItem,
  reorderPlaylistItems,
  duplicatePlaylist,
  publishPlaylist,
  getPlaylistHistory
} = require('../controllers/playlistController');

router.post('/', rbac([PERMISSIONS.CREATE_PLAYLIST]), createPlaylist);
router.get('/', getPlaylists);
router.get('/:id', getPlaylist);
router.put('/:id', rbac([PERMISSIONS. EDIT_PLAYLIST]), updatePlaylist);
router.delete('/:id', rbac([PERMISSIONS.DELETE_PLAYLIST]), deletePlaylist);
router.post('/:id/duplicate', rbac([PERMISSIONS.CREATE_PLAYLIST]), duplicatePlaylist);
router.post('/:id/publish', rbac([PERMISSIONS.EDIT_PLAYLIST]), publishPlaylist);
router.get('/:id/history', getPlaylistHistory);

router.post('/:id/items', rbac([PERMISSIONS. EDIT_PLAYLIST]), addPlaylistItem);
router.delete('/:id/items/:itemId', rbac([PERMISSIONS.EDIT_PLAYLIST]), removePlaylistItem);
router.post('/:id/reorder', rbac([PERMISSIONS. EDIT_PLAYLIST]), reorderPlaylistItems);

module.exports = router;