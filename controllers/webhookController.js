import * as model from '../models/webhookModel.js';

export const getWebhooks = async (req, res) => res.json(await model.getWebhooks(req.user.id));
export const addWebhook = async (req, res) => res.json(await model.addWebhook(req.user.id, req.body));
export const updateWebhook = async (req, res) => res.json(await model.updateWebhook(req.params.id, req.user.id, req.body));
export const deleteWebhook = async (req, res) => res.json(await model.deleteWebhook(req.params.id, req.user.id));