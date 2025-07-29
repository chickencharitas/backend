import * as model from '../models/breedingModel.js';

export const createGroup = async (req, res) => {
  const group = await model.createBreedingGroup(req.body);
  res.json(group);
};
export const listGroups = async (req, res) => {
  const groups = await model.getBreedingGroups(req.query);
  res.json(groups);
};
export const addMember = async (req, res) => {
  await model.addMember(req.params.groupId, req.body.chickenId, req.body.role);
  res.json({ message: "Added" });
};
export const removeMember = async (req, res) => {
  await model.removeMember(req.params.groupId, req.body.chickenId);
  res.json({ message: "Removed" });
};
export const groupMembers = async (req, res) => {
  const members = await model.getGroupMembers(req.params.groupId);
  res.json(members);
};
// Breeding (mating event)
export const createBreeding = async (req, res) => {
  const breeding = await model.createBreeding(req.body);
  res.json(breeding);
};
export const listBreedings = async (req, res) => {
  const breedings = await model.getBreedings(req.query);
  res.json(breedings);
};
// Eggs
export const addEgg = async (req, res) => {
  const egg = await model.addEggRecord(req.body);
  res.json(egg);
};
export const listEggs = async (req, res) => {
  const eggs = await model.getEggRecords(req.query);
  res.json(eggs);
};
// Pedigree
export const setPedigree = async (req, res) => {
  await model.setPedigree(req.body);
  res.json({ message: "Pedigree set" });
};
export const getPedigree = async (req, res) => {
  const pedigree = await model.getPedigree(req.params.chickenId);
  res.json(pedigree);
};
// Breeding goals
export const addGoal = async (req, res) => {
  const goal = await model.addBreedingGoal(req.body);
  res.json(goal);
};
export const listGoals = async (req, res) => {
  const goals = await model.getBreedingGoals(req.params.groupId);
  res.json(goals);
};
// Inbreeding coefficient
export const inbreedingCoeff = async (req, res) => {
  const coeff = await model.getInbreedingCoefficient(req.params.chickenId);
  res.json({ coefficient: coeff });
};

export const createBreed = async (req, res) => {
  const breed = await model.createBreed(req.body);
  res.json(breed);
};

// Pedigree tree recursion
export const getPedigreeTree = async (req, res) => {
  const tree = await model.getPedigreeTree(req.params.chickenId, 3);
  res.json(tree);
};