import * as fm from '../models/feedingModel.js';

export const getFeedBatches = async (req, res) => res.json(await fm.getFeedBatches());
export const addFeedBatch = async (req, res) => res.json(await fm.addFeedBatch(req.body));

export const getFeedings = async (req, res) => res.json(await fm.getFeedings(req.query));
export const addFeeding = async (req, res) => res.json(await fm.addFeeding(req.body));

export const getFeedingSchedules = async (req, res) => res.json(await fm.getFeedingSchedules(req.query));
export const addFeedingSchedule = async (req, res) => res.json(await fm.addFeedingSchedule(req.body));