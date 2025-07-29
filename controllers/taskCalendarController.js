import * as model from '../models/taskCalendarModel.js';

// Tasks
export const getTasks = async (req, res) => res.json(await model.getTasks(req.query));
export const addTask = async (req, res) => res.json(await model.addTask(req.body));
export const updateTaskStatus = async (req, res) => res.json(await model.updateTaskStatus(req.body));

// Calendar Events
export const getEvents = async (req, res) => res.json(await model.getEvents(req.query));
export const addEvent = async (req, res) => res.json(await model.addEvent(req.body));

// Alerts
export const getAlerts = async (req, res) => res.json(await model.getAlerts(req.query));
export const markAlertRead = async (req, res) => res.json(await model.markAlertRead(req.body));

// Reminders
export const getReminders = async (req, res) => res.json(await model.getReminders(req.query));
export const addReminder = async (req, res) => res.json(await model.addReminder(req.body));