import db from '../config/db.js';

// Vaccines
export const getVaccines = async (search) => {
  const res = await db.query(
    'SELECT * FROM vaccines WHERE LOWER(name) LIKE $1 ORDER BY name',
    [`%${(search || '').toLowerCase()}%`]
  );
  return res.rows;
};
export const createVaccine = async ({ name, description }) => {
  const res = await db.query(
    'INSERT INTO vaccines (name, description) VALUES ($1,$2) RETURNING *',
    [name, description]
  );
  return res.rows[0];
};

// Treatments
export const getTreatments = async (search) => {
  const res = await db.query(
    'SELECT * FROM treatments WHERE LOWER(name) LIKE $1 ORDER BY name',
    [`%${(search || '').toLowerCase()}%`]
  );
  return res.rows;
};
export const createTreatment = async ({ name, description }) => {
  const res = await db.query(
    'INSERT INTO treatments (name, description) VALUES ($1,$2) RETURNING *',
    [name, description]
  );
  return res.rows[0];
};

// Health Events
export const addHealthEvent = async (data) => {
  const { chicken_id, flock_id, event_type, event_date, details, notes, created_by } = data;
  const eventRes = await db.query(
    `INSERT INTO health_events
     (chicken_id, flock_id, event_type, event_date, details, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [chicken_id, flock_id, event_type, event_date, details, notes, created_by]
  );
  return eventRes.rows[0];
};

export const linkVaccine = async (event_id, vaccine_id, scheduled = false) => {
  await db.query(
    `INSERT INTO health_event_vaccines (event_id, vaccine_id, scheduled)
     VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [event_id, vaccine_id, scheduled]
  );
};
export const linkTreatment = async (event_id, treatment_id, dosage, duration) => {
  await db.query(
    `INSERT INTO health_event_treatments (event_id, treatment_id, dosage, duration)
     VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
    [event_id, treatment_id, dosage, duration]
  );
};

export const getHealthEvents = async ({ chicken_id, flock_id, event_type, search }) => {
  let q = `SELECT * FROM health_events WHERE 1=1`;
  let params = [];
  let idx = 1;
  if (chicken_id) { q += ` AND chicken_id=$${idx}`; params.push(chicken_id); idx++; }
  if (flock_id) { q += ` AND flock_id=$${idx}`; params.push(flock_id); idx++; }
  if (event_type) { q += ` AND event_type=$${idx}`; params.push(event_type); idx++; }
  if (search) { q += ` AND (LOWER(details) LIKE $${idx} OR LOWER(notes) LIKE $${idx})`; params.push(`%${search.toLowerCase()}%`); idx++; }
  q += ' ORDER BY event_date DESC, id DESC';
  const res = await db.query(q, params);
  return res.rows;
};

// Disease outbreaks
export const addOutbreak = async (data) => {
  const { disease, description, start_date, end_date, affected_flock_ids, notes } = data;
  const res = await db.query(
    `INSERT INTO disease_outbreaks
     (disease, description, start_date, end_date, affected_flock_ids, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [disease, description, start_date, end_date, affected_flock_ids, notes]
  );
  return res.rows[0];
};
export const getOutbreaks = async (params) => {
  const res = await db.query('SELECT * FROM disease_outbreaks ORDER BY start_date DESC');
  return res.rows;
};

// Analytics (example: mortality by cause)
export const getMortalityAnalysis = async ({ flock_id }) => {
  let q = `SELECT details, COUNT(*) AS count
           FROM health_events WHERE event_type IN ('mortality', 'culling')`;
  let params = [];
  if (flock_id) { q += ` AND flock_id=$1`; params.push(flock_id); }
  q += ' GROUP BY details ORDER BY count DESC';
  const res = await db.query(q, params);
  return res.rows;
};