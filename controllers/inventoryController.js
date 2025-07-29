import * as inv from '../models/inventoryModel.js';

// Locations
export const createLocation = async (req, res) => res.json(await inv.createLocation(req.body));
export const getLocations = async (req, res) => res.json(await inv.getLocations(req.query));

// Item types
export const getItemTypes = async (req, res) => res.json(await inv.getItemTypes(req.query.search));
export const createItemType = async (req, res) => res.json(await inv.createItemType(req.body));

// Items
export const getItems = async (req, res) => res.json(await inv.getItems(req.query));
export const createItem = async (req, res) => res.json(await inv.createItem(req.body));

// Batches
export const addBatch = async (req, res) => res.json(await inv.addBatch(req.body));
export const getInventory = async (req, res) => res.json(await inv.getInventory(req.query));

// Movements
export const addStockMovement = async (req, res) => { await inv.addStockMovement(req.body); res.json({}); };
export const getStockMovements = async (req, res) => res.json(await inv.getStockMovements(req.query));

// Alerts/analytics
export const getLowStock = async (req, res) => res.json(await inv.getLowStock(req.query));
export const getExpiringSoon = async (req, res) => res.json(await inv.getExpiringSoon(req.query));