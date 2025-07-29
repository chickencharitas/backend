import db from '../config/db.js';

// BREEDING GROUPS
export const createBreedingGroup = async (data) => {
  const res = await db.query(
    'INSERT INTO breeding_groups (name, description, farm_id) VALUES ($1,$2,$3) RETURNING *',
    [data.name, data.description, data.farm_id]
  );
  return res.rows[0];
};

export const getBreedingGroups = async ({ search, farm_id }) => {
  let q = 'SELECT * FROM breeding_groups WHERE 1=1';
  let params = [];
  let idx = 1;
  if (search) { q += ` AND LOWER(name) LIKE $${idx}`; params.push(`%${search.toLowerCase()}%`); idx++; }
  if (farm_id) { q += ` AND farm_id=$${idx}`; params.push(farm_id); idx++; }
  q += ' ORDER BY created_at DESC';
  const res = await db.query(q, params);
  return res.rows;
};

export const addMember = async (group_id, chicken_id, role) => {
  await db.query(
    'INSERT INTO breeding_group_members (group_id, chicken_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
    [group_id, chicken_id, role]
  );
};
export const removeMember = async (group_id, chicken_id) => {
  await db.query('DELETE FROM breeding_group_members WHERE group_id=$1 AND chicken_id=$2', [group_id, chicken_id]);
};

export const getGroupMembers = async (group_id) => {
  const res = await db.query(
    `SELECT c.*, m.role FROM chickens c
     JOIN breeding_group_members m ON m.chicken_id = c.id
     WHERE m.group_id=$1`, [group_id]
  );
  return res.rows;
};

// BREEDINGS (Mating Events)
export const createBreeding = async ({ group_id, date, notes }) => {
  const res = await db.query(
    'INSERT INTO breedings (group_id, date, notes) VALUES ($1,$2,$3) RETURNING *',
    [group_id, date, notes]
  );
  return res.rows[0];
};

export const getBreedings = async ({ group_id }) => {
  const res = await db.query('SELECT * FROM breedings WHERE group_id=$1 ORDER BY date DESC', [group_id]);
  return res.rows;
};

// EGG RECORDS
export const addEggRecord = async (data) => {
  const res = await db.query(
    `INSERT INTO egg_records (breeding_id, egg_code, laid_at, collected_at, fertile, hatched, chick_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [data.breeding_id, data.egg_code, data.laid_at, data.collected_at, data.fertile, data.hatched, data.chick_id]
  );
  return res.rows[0];
};

export const getEggRecords = async ({ breeding_id }) => {
  const res = await db.query('SELECT * FROM egg_records WHERE breeding_id=$1 ORDER BY laid_at DESC', [breeding_id]);
  return res.rows;
};

// PEDIGREE
export const setPedigree = async ({ chicken_id, father_id, mother_id }) => {
  await db.query(
    `INSERT INTO pedigrees (chicken_id, father_id, mother_id)
     VALUES ($1,$2,$3)
     ON CONFLICT (chicken_id)
     DO UPDATE SET father_id=$2, mother_id=$3`,
    [chicken_id, father_id, mother_id]
  );
};

export const getPedigree = async (chicken_id) => {
  const res = await db.query('SELECT * FROM pedigrees WHERE chicken_id=$1', [chicken_id]);
  return res.rows[0];
};

// BREEDING GOALS
export const addBreedingGoal = async ({ group_id, trait, goal_value, notes }) => {
  const res = await db.query(
    `INSERT INTO breeding_goals (group_id, trait, goal_value, notes)
     VALUES ($1,$2,$3,$4) RETURNING *`, [group_id, trait, goal_value, notes]
  );
  return res.rows[0];
};

export const getBreedingGoals = async (group_id) => {
  const res = await db.query('SELECT * FROM breeding_goals WHERE group_id=$1', [group_id]);
  return res.rows;
};

// ADVANCED: INBREEDING COEFFICIENT (simplified, real implementation may require recursion)
export const getInbreedingCoefficient = async (chicken_id) => {
  // Dummy: In real case, would compute from full pedigree tree
  // Here, just return 0 if no shared ancestor, 0.25 if both parents are the same chicken
  const pedigree = await getPedigree(chicken_id);
  if (!pedigree?.father_id || !pedigree?.mother_id) return 0;
  if (pedigree.father_id === pedigree.mother_id) return 0.25;
  return 0;
};

// Inline breed creation
export const createBreed = async ({ name, description }) => {
  const res = await db.query(
    'INSERT INTO breeds (name, description) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET description=EXCLUDED.description RETURNING *',
    [name, description]
  );
  return res.rows[0];
};

// Full recursive pedigree tree
export const getPedigreeTree = async (chickenId, depth = 3) => {
  if (!chickenId || depth === 0) return null;
  const chickenRes = await db.query('SELECT id, name, unique_tag, sex, breed_id FROM chickens WHERE id=$1', [chickenId]);
  const chicken = chickenRes.rows[0];
  if (!chicken) return null;
  const pedigree = await getPedigree(chickenId);
  const father = pedigree?.father_id ? await getPedigreeTree(pedigree.father_id, depth - 1) : null;
  const mother = pedigree?.mother_id ? await getPedigreeTree(pedigree.mother_id, depth - 1) : null;
  return {
    id: chicken.id,
    label: chicken.name || chicken.unique_tag,
    sex: chicken.sex,
    breed_id: chicken.breed_id,
    father,
    mother,
  };
};