import * as chickenModel from '../models/chickenModel.js';

// BREEDS
export const listBreeds = async (req, res) => {
  const breeds = await chickenModel.getBreeds(req.query.search);
  res.json(breeds);
};

// CHICKENS
export const registerChicken = async (req, res) => {
  const chicken = await chickenModel.createChicken(req.body);
  res.json(chicken);
};

export const bulkImport = async (req, res) => {
  const results = await chickenModel.bulkImportChickens(req.body.chickens);
  res.json(results);
};

export const listChickens = async (req, res) => {
  const chickens = await chickenModel.getChickens(req.query);
  res.json(chickens);
};

export const getChicken = async (req, res) => {
  const chicken = await chickenModel.getChickenById(req.params.id);
  res.json(chicken);
};

export const updateChicken = async (req, res) => {
  const updated = await chickenModel.updateChicken(req.params.id, req.body);
  res.json(updated);
};

// FLOCKS
export const createFlock = async (req, res) => {
  const flock = await chickenModel.createFlock(req.body);
  res.json(flock);
};

export const listFlocks = async (req, res) => {
  const flocks = await chickenModel.getFlocks(req.query);
  res.json(flocks);
};

export const addChickenToFlock = async (req, res) => {
  await chickenModel.addChickenToFlock(req.params.flockId, req.body.chickenId);
  res.json({ message: 'Chicken added to flock' });
};

export const removeChickenFromFlock = async (req, res) => {
  await chickenModel.removeChickenFromFlock(req.params.flockId, req.body.chickenId);
  res.json({ message: 'Chicken removed from flock' });
};

export const mergeFlocks = async (req, res) => {
  await chickenModel.mergeFlocks(req.body.sourceFlockId, req.body.targetFlockId);
  res.json({ message: 'Flocks merged' });
};

export const splitFlock = async (req, res) => {
  const newFlock = await chickenModel.splitFlock(req.params.flockId, req.body.newFlockName, req.body.chickenIds);
  res.json(newFlock);
};

// CULLING & MORTALITY
export const logCulling = async (req, res) => {
  await chickenModel.logCullingOrMortality({ ...req.body, type: 'cull' });
  res.json({ message: 'Culling logged' });
};

export const logMortality = async (req, res) => {
  await chickenModel.logCullingOrMortality({ ...req.body, type: 'mortality' });
  res.json({ message: 'Mortality logged' });
};

export const getCullingLogs = async (req, res) => {
  const logs = await chickenModel.getCullingLogs(req.query);
  res.json(logs);
};