import db from '../config/db.js';

// Feed batches
export const getFeedBatches = async () => {
  const res = await db.query('SELECT * FROM feed_batches ORDER BY received_date DESC');
  return res.rows;
};
export const addFeedBatch = async (data) => {
  const { name, supplier, received_date, quantity, unit, cost, expiry_date, notes } = data;
  const res = await db.query(
    `INSERT INTO feed_batches
      (name, supplier, received_date, quantity, unit, cost, expiry_date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [name, supplier, received_date, quantity, unit, cost, expiry_date, notes]
  );
  return res.rows[0];
};

// Feeding logs
export const getFeedings = async ({ flock_id }) => {
  let q = 'SELECT f.*, b.name AS feed_name FROM feedings f LEFT JOIN feed_batches b ON f.feed_batch_id=b.id WHERE 1=1';
  let params = [];
  if (flock_id) { q += ' AND f.flock_id=$1'; params.push(flock_id); }
  q += ' ORDER BY f.date DESC, f.id DESC';
  const res = await db.query(q, params);
  return res.rows;
};
export const addFeeding = async (data) => {
  const { flock_id, date, feed_batch_id, ration, quantity, unit, notes } = data;
  const res = await db.query(
    `INSERT INTO feedings
      (flock_id, date, feed_batch_id, ration, quantity, unit, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [flock_id, date, feed_batch_id, ration, quantity, unit, notes]
  );
  return res.rows[0];
};

// Feeding schedules
export const getFeedingSchedules = async ({ flock_id }) => {
  let q = 'SELECT s.*, b.name AS feed_name FROM feeding_schedules s LEFT JOIN feed_batches b ON s.feed_batch_id=b.id WHERE 1=1';
  let params = [];
  if (flock_id) { q += ' AND s.flock_id=$1'; params.push(flock_id); }
  q += ' ORDER BY s.start_age_days';
  const res = await db.query(q, params);
  return res.rows;
};
export const addFeedingSchedule = async (data) => {
  const { flock_id, feed_batch_id, schedule_type, start_age_days, end_age_days, ration, quantity_per_day, unit, notes } = data;
  const res = await db.query(
    `INSERT INTO feeding_schedules
      (flock_id, feed_batch_id, schedule_type, start_age_days, end_age_days, ration, quantity_per_day, unit, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [flock_id, feed_batch_id, schedule_type, start_age_days, end_age_days, ration, quantity_per_day, unit, notes]
  );
  return res.rows[0];
};