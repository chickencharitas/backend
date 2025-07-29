import db from '../config/db.js';

// BREEDS
export const getBreeds = async (search) => {
  const res = await db.query(
    'SELECT * FROM breeds WHERE LOWER(name) LIKE $1 ORDER BY name',
    [`%${(search || '').toLowerCase()}%`]
  );
  return res.rows;
};

// CHICKENS
export const createChicken = async (chicken) => {
  const {
    unique_tag, name, breed_id, sex, color, hatch_date, source,
    generation, genetic_line, weight, health_status, vaccination_status,
    farm_id, facility_id, notes
  } = chicken;
  const res = await db.query(
    `INSERT INTO chickens
    (unique_tag, name, breed_id, sex, color, hatch_date, source, generation, genetic_line, weight, health_status, vaccination_status, farm_id, facility_id, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [unique_tag, name, breed_id, sex, color, hatch_date, source, generation, genetic_line, weight, health_status, vaccination_status, farm_id, facility_id, notes]
  );
  return res.rows[0];
};

export const bulkImportChickens = async (chickens) => {
  const results = [];
  for (const chicken of chickens) {
    results.push(await createChicken(chicken));
  }
  return results;
};

export const getChickens = async ({ search, farm_id, facility_id, flock_id, alive }) => {
  let q = `SELECT c.*, b.name AS breed_name FROM chickens c LEFT JOIN breeds b ON c.breed_id=b.id WHERE 1=1`;
  let params = [];
  let idx = 1;
  if (search) { q += ` AND (LOWER(unique_tag) LIKE $${idx} OR LOWER(name) LIKE $${idx})`; params.push(`%${search.toLowerCase()}%`); idx++; }
  if (farm_id) { q += ` AND farm_id=$${idx}`; params.push(farm_id); idx++; }
  if (facility_id) { q += ` AND facility_id=$${idx}`; params.push(facility_id); idx++; }
  if (flock_id) { q += ` AND flock_id=$${idx}`; params.push(flock_id); idx++; }
  if (alive !== undefined) { q += ` AND alive=$${idx}`; params.push(alive); idx++; }
  q += ` ORDER BY id DESC`;
  const res = await db.query(q, params);
  return res.rows;
};

export const getChickenById = async (id) => {
  const res = await db.query('SELECT * FROM chickens WHERE id=$1', [id]);
  return res.rows[0];
};

export const updateChicken = async (id, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const sets = keys.map((k, i) => `${k}=$${i+1}`);
  const q = `UPDATE chickens SET ${sets.join(', ')} WHERE id=$${keys.length+1} RETURNING *`;
  const res = await db.query(q, [...values, id]);
  return res.rows[0];
};

// FLOCKS
export const createFlock = async ({ name, description, farm_id, facility_id }) => {
  const res = await db.query(
    'INSERT INTO flocks (name, description, farm_id, facility_id) VALUES ($1,$2,$3,$4) RETURNING *',
    [name, description, farm_id, facility_id]
  );
  return res.rows[0];
};

export const getFlocks = async ({ search, farm_id, facility_id }) => {
  let q = 'SELECT * FROM flocks WHERE 1=1';
  let params = [];
  let idx = 1;
  if (search) { q += ` AND LOWER(name) LIKE $${idx}`; params.push(`%${search.toLowerCase()}%`); idx++; }
  if (farm_id) { q += ` AND farm_id=$${idx}`; params.push(farm_id); idx++; }
  if (facility_id) { q += ` AND facility_id=$${idx}`; params.push(facility_id); idx++; }
  q += ' ORDER BY created_at DESC';
  const res = await db.query(q, params);
  return res.rows;
};

export const addChickenToFlock = async (flock_id, chicken_id) => {
  await db.query('INSERT INTO flock_chickens (flock_id, chicken_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [flock_id, chicken_id]);
  await db.query('UPDATE chickens SET flock_id=$1 WHERE id=$2', [flock_id, chicken_id]);
};

export const removeChickenFromFlock = async (flock_id, chicken_id) => {
  await db.query('DELETE FROM flock_chickens WHERE flock_id=$1 AND chicken_id=$2', [flock_id, chicken_id]);
  await db.query('UPDATE chickens SET flock_id=NULL WHERE id=$1', [chicken_id]);
};

export const mergeFlocks = async (sourceFlockId, targetFlockId) => {
  // Move all chickens from source to target
  await db.query('UPDATE chickens SET flock_id=$1 WHERE flock_id=$2', [targetFlockId, sourceFlockId]);
  await db.query('DELETE FROM flocks WHERE id=$1', [sourceFlockId]);
};

export const splitFlock = async (flock_id, newFlockName, chicken_ids) => {
  // Create new flock and move chickens to it
  const flock = await getFlockById(flock_id);
  const newFlock = await createFlock({
    name: newFlockName,
    description: `Split from ${flock.name}`,
    farm_id: flock.farm_id,
    facility_id: flock.facility_id,
  });
  for (const chicken_id of chicken_ids) {
    await addChickenToFlock(newFlock.id, chicken_id);
  }
  return newFlock;
};

export const getFlockById = async (id) => {
  const res = await db.query('SELECT * FROM flocks WHERE id=$1', [id]);
  return res.rows[0];
};

// CULLING & MORTALITY
export const logCullingOrMortality = async ({ chicken_id, flock_id, type, reason, notes }) => {
  await db.query(
    `INSERT INTO culling_mortality (chicken_id, flock_id, type, reason, notes)
     VALUES ($1, $2, $3, $4, $5)`,
    [chicken_id, flock_id, type, reason, notes]
  );
  if (type === 'cull' || type === 'mortality') {
    await db.query('UPDATE chickens SET alive=FALSE WHERE id=$1', [chicken_id]);
  }
};

export const getCullingLogs = async ({ chicken_id, flock_id }) => {
  let q = 'SELECT * FROM culling_mortality WHERE 1=1';
  let params = [];
  let idx = 1;
  if (chicken_id) { q += ` AND chicken_id=$${idx}`; params.push(chicken_id); idx++; }
  if (flock_id) { q += ` AND flock_id=$${idx}`; params.push(flock_id); idx++; }
  q += ' ORDER BY date DESC';
  const res = await db.query(q, params);
  return res.rows;
};