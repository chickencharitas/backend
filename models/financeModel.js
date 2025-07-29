import db from '../config/db.js';

// Partners
export const createPartner = async (data) => {
  const { type, name, email, phone, address } = data;
  const res = await db.query(
    'INSERT INTO business_partners (type, name, email, phone, address) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [type, name, email, phone, address]
  );
  return res.rows[0];
};
export const getPartners = async ({ type, search }) => {
  let q = 'SELECT * FROM business_partners WHERE 1=1';
  let params = [], idx = 1;
  if (type) { q += ` AND type=$${idx}`; params.push(type); idx++; }
  if (search) { q += ` AND LOWER(name) LIKE $${idx}`; params.push(`%${search.toLowerCase()}%`); idx++; }
  q += ' ORDER BY name';
  const res = await db.query(q, params);
  return res.rows;
};

// Sales/Purchases (Orders)
export const createOrder = async (table, data) => {
  const { partner_id, order_date, status, notes } = data;
  const res = await db.query(
    `INSERT INTO ${table} (partner_id, order_date, status, notes) VALUES ($1,$2,$3,$4) RETURNING *`,
    [partner_id, order_date, status, notes]
  );
  return res.rows[0];
};
export const getOrders = async (table, { search, status, partner_id }) => {
  let q = `SELECT o.*, p.name AS partner_name FROM ${table} o LEFT JOIN business_partners p ON o.partner_id=p.id WHERE 1=1`;
  let params = [], idx = 1;
  if (search) { q += ` AND (LOWER(p.name) LIKE $${idx})`; params.push(`%${search.toLowerCase()}%`); idx++; }
  if (status) { q += ` AND o.status=$${idx}`; params.push(status); idx++; }
  if (partner_id) { q += ` AND o.partner_id=$${idx}`; params.push(partner_id); idx++; }
  q += ' ORDER BY o.order_date DESC, o.id DESC';
  const res = await db.query(q, params);
  return res.rows;
};
export const updateOrderTotal = async (table, order_id) => {
  const itemTable = table === "sale_orders" ? "sale_order_items" : "purchase_order_items";
  await db.query(
    `UPDATE ${table} SET total = (SELECT COALESCE(SUM(total),0) FROM ${itemTable} WHERE order_id=$1) WHERE id=$1`, [order_id]
  );
};
export const getOrder = async (table, id) => {
  const res = await db.query(`SELECT * FROM ${table} WHERE id=$1`, [id]);
  return res.rows[0];
};

// Order Items
export const addOrderItem = async (table, data) => {
  const { order_id, item_id, description, quantity, unit_price } = data;
  const total = Number(quantity) * Number(unit_price);
  const res = await db.query(
    `INSERT INTO ${table} (order_id, item_id, description, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [order_id, item_id, description, quantity, unit_price, total]
  );
  return res.rows[0];
};
export const getOrderItems = async (table, order_id) => {
  const res = await db.query(`SELECT * FROM ${table} WHERE order_id=$1`, [order_id]);
  return res.rows;
};

// Payments
export const addPayment = async (data) => {
  const { order_type, order_id, amount, method, notes } = data;
  const res = await db.query(
    `INSERT INTO payments (order_type, order_id, amount, method, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [order_type, order_id, amount, method, notes]
  );
  return res.rows[0];
};
export const getPayments = async ({ order_type, order_id }) => {
  let q = 'SELECT * FROM payments WHERE 1=1';
  let params = [], idx = 1;
  if (order_type) { q += ` AND order_type=$${idx}`; params.push(order_type); idx++; }
  if (order_id) { q += ` AND order_id=$${idx}`; params.push(order_id); idx++; }
  q += ' ORDER BY date DESC';
  const res = await db.query(q, params);
  return res.rows;
};
export const getOrderPaid = async (order_type, order_id) => {
  const res = await db.query(
    `SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE order_type=$1 AND order_id=$2`, [order_type, order_id]
  );
  return Number(res.rows[0].paid);
};