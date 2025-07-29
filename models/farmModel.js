import db from '../config/db.js';

// FARM CRUD
export const createFarm = async ({ name, location, description }) => {
  const res = await db.query(
    'INSERT INTO farms (name, location, description) VALUES ($1, $2, $3) RETURNING *',
    [name, location, description]
  );
  return res.rows[0];
};

export const getFarmById = async (id) => {
  const res = await db.query('SELECT * FROM farms WHERE id=$1', [id]);
  return res.rows[0];
};

export const getFarms = async ({ search }) => {
  let q = 'SELECT * FROM farms';
  let params = [];
  if (search) {
    q += ' WHERE LOWER(name) LIKE $1';
    params.push(`%${search.toLowerCase()}%`);
  }
  q += ' ORDER BY name';
  const res = await db.query(q, params);
  return res.rows;
};

export const updateFarm = async (id, data) => {
  const { name, location, description } = data;
  const res = await db.query(
    'UPDATE farms SET name=$1, location=$2, description=$3 WHERE id=$4 RETURNING *',
    [name, location, description, id]
  );
  return res.rows[0];
};

export const deleteFarm = async (id) => {
  await db.query('DELETE FROM farms WHERE id=$1', [id]);
};

// FACILITY CRUD
export const createFacility = async ({ name, type, capacity, farmId, description }) => {
  const res = await db.query(
    'INSERT INTO facilities (name, type, capacity, farm_id, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [name, type, capacity, farmId, description]
  );
  return res.rows[0];
};

export const getFacilityById = async (id) => {
  const res = await db.query('SELECT * FROM facilities WHERE id=$1', [id]);
  return res.rows[0];
};

export const getFacilities = async ({ search, farmId, type }) => {
  let q = 'SELECT * FROM facilities WHERE 1=1';
  let params = [];
  let idx = 1;
  if (search) {
    q += ` AND LOWER(name) LIKE $${idx++}`;
    params.push(`%${search.toLowerCase()}%`);
  }
  if (farmId) {
    q += ` AND farm_id = $${idx++}`;
    params.push(farmId);
  }
  if (type) {
    q += ` AND type = $${idx++}`;
    params.push(type);
  }
  q += ' ORDER BY name';
  const res = await db.query(q, params);
  return res.rows;
};

export const updateFacility = async (id, data) => {
  const { name, type, capacity, description } = data;
  const res = await db.query(
    'UPDATE facilities SET name=$1, type=$2, capacity=$3, description=$4 WHERE id=$5 RETURNING *',
    [name, type, capacity, description, id]
  );
  return res.rows[0];
};

export const deleteFacility = async (id) => {
  await db.query('DELETE FROM facilities WHERE id=$1', [id]);
};

// FACILITY ASSIGNMENT
export const assignUserToFacility = async (facilityId, userId) => {
  await db.query('INSERT INTO facility_users (facility_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [facilityId, userId]);
};

export const removeUserFromFacility = async (facilityId, userId) => {
  await db.query('DELETE FROM facility_users WHERE facility_id=$1 AND user_id=$2', [facilityId, userId]);
};

export const getFacilityUsers = async (facilityId) => {
  const res = await db.query(
    'SELECT u.id, u.name, u.email FROM users u JOIN facility_users fu ON u.id = fu.user_id WHERE fu.facility_id=$1',
    [facilityId]
  );
  return res.rows;
};