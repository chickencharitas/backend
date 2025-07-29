import db from '../config/db.js';

// Egg production
export const getEggProductionStats = async ({ flock_id, from, to }) => {
  let q = `SELECT date, SUM(collected) AS collected, SUM(broken) AS broken, SUM(abnormal) AS abnormal
           FROM egg_productions WHERE 1=1`;
  let params = [];
  let idx = 1;
  if (flock_id) { q += ` AND flock_id=$${idx}`; params.push(flock_id); idx++; }
  if (from) { q += ` AND date >= $${idx}`; params.push(from); idx++; }
  if (to) { q += ` AND date <= $${idx}`; params.push(to); idx++; }
  q += ' GROUP BY date ORDER BY date';
  const res = await db.query(q, params);
  return res.rows;
};

// Hatchability/fertility
export const getHatchStats = async ({ batch_id, from, to }) => {
  let q = `SELECT date, total_eggs, hatched, dead_in_shell, culled
           FROM hatch_events WHERE 1=1`;
  let params = [];
  let idx = 1;
  if (batch_id) { q += ` AND batch_id=$${idx}`; params.push(batch_id); idx++; }
  if (from) { q += ` AND date >= $${idx}`; params.push(from); idx++; }
  if (to) { q += ` AND date <= $${idx}`; params.push(to); idx++; }
  q += ' ORDER BY date';
  const res = await db.query(q, params);
  return res.rows;
};

// Chick survival
export const getChickSurvivalStats = async ({ hatch_event_id }) => {
  const res = await db.query(
    `SELECT date, alive, dead, culled FROM chick_survivals WHERE hatch_event_id=$1 ORDER BY date`, [hatch_event_id]
  );
  return res.rows;
};

// Growth
export const getGrowthStats = async ({ flock_id, chicken_id, from, to }) => {
  let q = `SELECT date, AVG(weight) as avg_weight
           FROM growth_logs WHERE 1=1`;
  let params = [];
  let idx = 1;
  if (flock_id) { q += ` AND flock_id=$${idx}`; params.push(flock_id); idx++; }
  if (chicken_id) { q += ` AND chicken_id=$${idx}`; params.push(chicken_id); idx++; }
  if (from) { q += ` AND date >= $${idx}`; params.push(from); idx++; }
  if (to) { q += ` AND date <= $${idx}`; params.push(to); idx++; }
  q += ' GROUP BY date ORDER BY date';
  const res = await db.query(q, params);
  return res.rows;
};

// Feed conversion
export const getFeedConversionStats = async ({ flock_id, from, to }) => {
  let q = `SELECT date, feed_consumed, weight_gain FROM feed_conversion_logs WHERE 1=1`;
  let params = [];
  let idx = 1;
  if (flock_id) { q += ` AND flock_id=$${idx}`; params.push(flock_id); idx++; }
  if (from) { q += ` AND date >= $${idx}`; params.push(from); idx++; }
  if (to) { q += ` AND date <= $${idx}`; params.push(to); idx++; }
  q += ' ORDER BY date';
  const res = await db.query(q, params);
  return res.rows;
};

// Genetic trait tracking
export const getGeneticTraits = async ({ chicken_id, trait }) => {
  let q = `SELECT date, trait, value, notes FROM genetic_traits WHERE 1=1`;
  let params = [];
  let idx = 1;
  if (chicken_id) { q += ` AND chicken_id=$${idx}`; params.push(chicken_id); idx++; }
  if (trait) { q += ` AND trait=$${idx}`; params.push(trait); idx++; }
  q += ' ORDER BY date';
  const res = await db.query(q, params);
  return res.rows;
};