import {
  createFarm, getFarmById, getFarms, updateFarm, deleteFarm,
  createFacility, getFacilityById, getFacilities, updateFacility, deleteFacility,
  assignUserToFacility, removeUserFromFacility, getFacilityUsers
} from '../models/farmModel.js';

// FARM
export const addFarm = async (req, res) => {
  const farm = await createFarm(req.body);
  res.json(farm);
};

export const listFarms = async (req, res) => {
  const farms = await getFarms({ search: req.query.search });
  res.json(farms);
};

export const updateFarmInfo = async (req, res) => {
  const updated = await updateFarm(req.params.id, req.body);
  res.json(updated);
};

export const removeFarm = async (req, res) => {
  await deleteFarm(req.params.id);
  res.json({ message: 'Farm deleted' });
};

// FACILITY
export const addFacility = async (req, res) => {
  const facility = await createFacility(req.body);
  res.json(facility);
};

export const listFacilities = async (req, res) => {
  const facilities = await getFacilities({
    search: req.query.search,
    farmId: req.query.farmId,
    type: req.query.type
  });
  res.json(facilities);
};

export const updateFacilityInfo = async (req, res) => {
  const updated = await updateFacility(req.params.id, req.body);
  res.json(updated);
};

export const removeFacility = async (req, res) => {
  await deleteFacility(req.params.id);
  res.json({ message: 'Facility deleted' });
};

// FACILITY ASSIGNMENT
export const assignUser = async (req, res) => {
  await assignUserToFacility(req.params.facilityId, req.body.userId);
  res.json({ message: 'User assigned' });
};

export const removeUser = async (req, res) => {
  await removeUserFromFacility(req.params.facilityId, req.body.userId);
  res.json({ message: 'User removed' });
};

export const listFacilityUsers = async (req, res) => {
  const users = await getFacilityUsers(req.params.facilityId);
  res.json(users);
};