const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  // Camera
  getCameraDevices, addCameraDevice, getCameraPresets, saveCameraPreset, recallCameraPreset,
  moveCameraAbsolute, moveCameraRelative, deleteCameraDevice, updateCameraDevice,
  // DMX
  getDMXControllers, addDMXController, getDMXFixtures, addDMXFixture,
  getDMXScenes, createDMXScene, setDMXSceneData, getDMXSceneData,
  // Mixer
  getAudioMixers, addAudioMixer, getMixerChannels, setChannelLevel,
  getMixerScenes, createMixerScene, saveMixerSceneSettings,
  // Router
  getVideoRouters, addVideoRouter, getRouterInputs, getRouterOutputs, routeVideo,
  getRouterPresets, createRouterPreset, applyRouterPreset
} = require('../controllers/deviceController');

const router = express.Router();
router.use(authenticate);

// Camera Routes
router.get('/camera', getCameraDevices);
router.post('/camera', addCameraDevice);
router.get('/camera/:camera_id/presets', getCameraPresets);
router.post('/camera/:camera_id/presets', saveCameraPreset);
router.get('/camera/preset/:preset_id/recall', recallCameraPreset);
router.post('/camera/:camera_id/move/absolute', moveCameraAbsolute);
router.post('/camera/:camera_id/move/relative', moveCameraRelative);
router.delete('/camera/:camera_id', deleteCameraDevice);
router.put('/camera/:camera_id', updateCameraDevice);

// DMX Routes
router.get('/dmx', getDMXControllers);
router.post('/dmx', addDMXController);
router.get('/dmx/:controller_id/fixtures', getDMXFixtures);
router.post('/dmx/:controller_id/fixtures', addDMXFixture);
router.get('/dmx/:controller_id/scenes', getDMXScenes);
router.post('/dmx/:controller_id/scenes', createDMXScene);
router.post('/dmx/scene/:scene_id/data', setDMXSceneData);
router.get('/dmx/scene/:scene_id/data', getDMXSceneData);

// Mixer Routes
router.get('/mixer', getAudioMixers);
router.post('/mixer', addAudioMixer);
router.get('/mixer/:mixer_id/channels', getMixerChannels);
router.post('/mixer/channel/:channel_id/level', setChannelLevel);
router.get('/mixer/:mixer_id/scenes', getMixerScenes);
router.post('/mixer/:mixer_id/scenes', createMixerScene);
router.post('/mixer/scene/:scene_id/settings', saveMixerSceneSettings);

// Router Routes
router.get('/router', getVideoRouters);
router.post('/router', addVideoRouter);
router.get('/router/:router_id/inputs', getRouterInputs);
router.get('/router/:router_id/outputs', getRouterOutputs);
router.post('/router/:router_id/route', routeVideo);
router.get('/router/:router_id/presets', getRouterPresets);
router.post('/router/:router_id/presets', createRouterPreset);
router.get('/router/preset/:preset_id/apply', applyRouterPreset);

module.exports = router;