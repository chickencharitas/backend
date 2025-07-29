import * as am from '../models/analyticsModel.js';

export const getEggProductionStats = async (req, res) => res.json(await am.getEggProductionStats(req.query));
export const getHatchStats = async (req, res) => res.json(await am.getHatchStats(req.query));
export const getChickSurvivalStats = async (req, res) => res.json(await am.getChickSurvivalStats(req.query));
export const getGrowthStats = async (req, res) => res.json(await am.getGrowthStats(req.query));
export const getFeedConversionStats = async (req, res) => res.json(await am.getFeedConversionStats(req.query));
export const getGeneticTraits = async (req, res) => res.json(await am.getGeneticTraits(req.query));