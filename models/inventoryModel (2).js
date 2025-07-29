import db from '../config/db.js';

// Consumables
export const getConsumables = async ({ search, type }) => {
  let q = 'SELECT * FROM consumables WHERE 1=1';
  let params = [], idx = 1;
  if (search) { q += ` AND LOWER(name) LIKE $${idx}`; params.push(`%${search.toLowerCase()}%`); idx++; }
  if (type) { q += ` AND type=$${idx}`; params.push(type); idx++; }
  q += ' ORDER BY name';
  const res = await db.query(q, params);
  return res.rows;
};
export const addConsumable = async (data) => {
  const { name, type, quantity, unit, reorder_level, notes } = data;
  const res = await db.query(
    `INSERT INTO consumables (name, type, quantity, unit, reorder_level, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, type, quantity, unit, reorder_level, notes]
  );
  return res.rows[0];
};
export const updateConsumableStock = async ({ id, quantity }) => {
  const res = await db.query(
    `UPDATE consumables SET quantity=$2 WHERE id=$1 RETURNING *`,
    [id, quantity]
  );
  return res.rows[0];
};

// Equipment
export const getEquipment = async ({ search, type, status }) => {
  let q = 'SELECT * FROM equipment WHERE 1=1';
  let params = [], idx = 1;
  if (search) { q += ` AND LOWER(name) LIKE $${idx}`; params.push(`%${search.toLowerCase()}%`); idx++; }
  if (type) { q += ` AND type=$${idx}`; params.push(type); idx++; }
  if (status) { q += ` AND status=$${idx}`; params.push(status); idx++; }
  q += ' ORDER BY name';
  const res = await db.query(q, params);
  return res.rows;
};
export const addEquipment = async (data) => {
  const { name, type, status, purchase_date, location, assigned_to, notes } = data;
  const res = await db.query(
    `INSERT INTO equipment (name, type, status, purchase_date, location, assigned_to, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [name, type, status, purchase_date, location, assigned_to, notes]
  );
  return res.rows[0];
};
export const updateEquipmentStatus = async ({ id, status }) => {
  const res = await db.query(
    `UPDATE equipment SET status=$2 WHERE id=$1 RETURNING *`,
    [id, status]
  );
  return res.rows[0];
};