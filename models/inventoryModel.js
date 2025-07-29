import db from '../config/db.js';

// Locations
export const createLocation = async ({ name, description, farm_id }) => {
  const res = await db.query(
    'INSERT INTO inventory_locations (name, description, farm_id) VALUES ($1,$2,$3) RETURNING *',
    [name, description, farm_id]
  );
  return res.rows[0];
};
export const getLocations = async ({ farm_id }) => {
  const res = await db.query('SELECT * FROM inventory_locations WHERE farm_id=$1 ORDER BY name', [farm_id]);
  return res.rows;
};

// Item types
export const getItemTypes = async (search) => {
  const res = await db.query(
    'SELECT * FROM item_types WHERE LOWER(name) LIKE $1 ORDER BY name',
    [`%${(search || '').toLowerCase()}%`]
  );
  return res.rows;
};
export const createItemType = async ({ name }) => {
  const res = await db.query(
    'INSERT INTO item_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *', [name]
  );
  return res.rows[0];
};

// Items
export const getItems = async ({ search, type_id }) => {
  let q = 'SELECT i.*, t.name AS type_name FROM items i LEFT JOIN item_types t ON i.type_id=t.id WHERE 1=1';
  let params = [];
  let idx = 1;
  if (search) { q += ` AND (LOWER(i.name) LIKE $${idx} OR LOWER(i.sku) LIKE $${idx})`; params.push(`%${search.toLowerCase()}%`); idx++; }
  if (type_id) { q += ` AND i.type_id=$${idx}`; params.push(type_id); idx++; }
  q += ' ORDER BY i.name';
  const res = await db.query(q, params);
  return res.rows;
};
export const createItem = async (data) => {
  const { sku, name, type_id, unit, conversion_factor, description } = data;
  const res = await db.query(
    `INSERT INTO items (sku, name, type_id, unit, conversion_factor, description)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [sku, name, type_id, unit, conversion_factor, description]
  );
  return res.rows[0];
};

// Batches
export const addBatch = async (data) => {
  const { item_id, location_id, quantity, unit, batch_code, expiry_date, lot_number } = data;
  const res = await db.query(
    `INSERT INTO inventory_batches (item_id, location_id, quantity, unit, batch_code, expiry_date, lot_number)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [item_id, location_id, quantity, unit, batch_code, expiry_date, lot_number]
  );
  return res.rows[0];
};
export const getInventory = async ({ location_id, item_id }) => {
  let q = `SELECT b.*, i.name as item_name, i.sku, i.unit as item_unit
           FROM inventory_batches b
           JOIN items i ON b.item_id=i.id
           WHERE 1=1`;
  let params = [], idx = 1;
  if (location_id) { q += ` AND b.location_id=$${idx}`; params.push(location_id); idx++; }
  if (item_id) { q += ` AND b.item_id=$${idx}`; params.push(item_id); idx++; }
  q += ' ORDER BY expiry_date NULLS LAST, received_at DESC';
  const res = await db.query(q, params);
  return res.rows;
};

// Stock movement
export const addStockMovement = async (data) => {
  const { batch_id, movement_type, quantity, from_location_id, to_location_id, notes } = data;
  await db.query(
    `INSERT INTO stock_movements (batch_id, movement_type, quantity, from_location_id, to_location_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [batch_id, movement_type, quantity, from_location_id, to_location_id, notes]
  );
};

export const getStockMovements = async ({ batch_id, location_id }) => {
  let q = 'SELECT * FROM stock_movements WHERE 1=1';
  let params = [], idx = 1;
  if (batch_id) { q += ` AND batch_id=$${idx}`; params.push(batch_id); idx++; }
  if (location_id) { q += ` AND (from_location_id=$${idx} OR to_location_id=$${idx})`; params.push(location_id); idx++; }
  q += ' ORDER BY date DESC';
  const res = await db.query(q, params);
  return res.rows;
};

// Alerts/analytics
export const getLowStock = async ({ location_id, threshold = 10 }) => {
  const res = await db.query(
    `SELECT i.name, SUM(b.quantity) as total_qty
     FROM inventory_batches b
     JOIN items i ON b.item_id=i.id
     WHERE b.location_id=$1
     GROUP BY i.name
     HAVING SUM(b.quantity) < $2
     ORDER BY total_qty ASC`,
    [location_id, threshold]
  );
  return res.rows;
};

export const getExpiringSoon = async ({ location_id, days = 14 }) => {
  const res = await db.query(
    `SELECT b.*, i.name as item_name, i.sku
     FROM inventory_batches b
     JOIN items i ON b.item_id=i.id
     WHERE b.location_id=$1 AND b.expiry_date IS NOT NULL
       AND b.expiry_date <= CURRENT_DATE + $2::interval
     ORDER BY b.expiry_date ASC`,
    [location_id, `${days} days`]
  );
  return res.rows;
};