import * as model from '../models/alertRuleModel.js';

export const getAlertRules = async (req, res) => res.json(await model.getAlertRules({ user_id: req.user.id }));
export const addAlertRule = async (req, res) => res.json(await model.addAlertRule({ ...req.body, user_id: req.user.id }));
export const updateAlertRule = async (req, res) => res.json(await model.updateAlertRule({ ...req.body, user_id: req.user.id }));
export const deleteAlertRule = async (req, res) => res.json(await model.deleteAlertRule({ id: req.body.id, user_id: req.user.id }));
export const getNotificationLogs = async (req, res) => res.json(await model.getNotificationLogs({ user_id: req.user.id }));