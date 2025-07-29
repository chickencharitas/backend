import db from '../config/db.js';

// Tasks
export const getTasks = async ({ user_id, status, type }) => {
  let q = 'SELECT * FROM tasks WHERE 1=1', params = [], idx = 1;
  if (user_id) { q += ` AND assigned_to=$${idx}`; params.push(user_id); idx++; }
  if (status) { q += ` AND status=$${idx}`; params.push(status); idx++; }
  if (type) { q += ` AND type=$${idx}`; params.push(type); idx++; }
  q += ' ORDER BY due_date, due_time';
  return (await db.query(q, params)).rows;
};
export const addTask = async (data) => {
  const { title, description, assigned_to, due_date, due_time, priority, type, related_id, created_by } = data;
  const res = await db.query(
    `INSERT INTO tasks (title, description, assigned_to, due_date, due_time, priority, type, related_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [title, description, assigned_to, due_date, due_time, priority, type, related_id, created_by]
  );
  return res.rows[0];
};
export const updateTaskStatus = async ({ id, status }) => {
  return (await db.query(`UPDATE tasks SET status=$2 WHERE id=$1 RETURNING *`, [id, status])).rows[0];
};

// Calendar Events
export const getEvents = async ({ from, to, type }) => {
  let q = 'SELECT * FROM calendar_events WHERE 1=1', params = [], idx = 1;
  if (from) { q += ` AND event_date >= $${idx}`; params.push(from); idx++; }
  if (to) { q += ` AND event_date <= $${idx}`; params.push(to); idx++; }
  if (type) { q += ` AND type=$${idx}`; params.push(type); idx++; }
  q += ' ORDER BY event_date, event_time';
  return (await db.query(q, params)).rows;
};
export const addEvent = async (data) => {
  const { title, description, event_date, event_time, type, related_id, created_by } = data;
  const res = await db.query(
    `INSERT INTO calendar_events (title, description, event_date, event_time, type, related_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [title, description, event_date, event_time, type, related_id, created_by]
  );
  return res.rows[0];
};

// Alerts
export const getAlerts = async ({ user_id, unread }) => {
  let q = 'SELECT * FROM alerts WHERE 1=1', params = [], idx = 1;
  if (user_id) { q += ` AND user_id=$${idx}`; params.push(user_id); idx++; }
  if (unread) { q += ` AND is_read=FALSE`; }
  q += ' ORDER BY created_at DESC';
  return (await db.query(q, params)).rows;
};
export const markAlertRead = async ({ id }) => {
  return (await db.query(`UPDATE alerts SET is_read=TRUE WHERE id=$1 RETURNING *`, [id])).rows[0];
};

// Reminders
export const getReminders = async ({ user_id }) => {
  let q = 'SELECT * FROM reminders WHERE 1=1', params = [], idx = 1;
  if (user_id) { q += ` AND user_id=$${idx}`; params.push(user_id); idx++; }
  q += ' ORDER BY remind_at';
  return (await db.query(q, params)).rows;
};
export const addReminder = async (data) => {
  const { user_id, task_id, remind_at, channel } = data;
  const res = await db.query(
    `INSERT INTO reminders (user_id, task_id, remind_at, channel) VALUES ($1,$2,$3,$4) RETURNING *`,
    [user_id, task_id, remind_at, channel]
  );
  return res.rows[0];
};