import db from '../config/db.js';

export const getAlertRules = async ({ user_id }) =>
  (await db.query('SELECT * FROM alert_rules WHERE user_id=$1 ORDER BY id DESC', [user_id])).rows;

export const addAlertRule = async (data) => {
  const { user_id, type, condition, channel } = data;
  return (
    await db.query(
      `INSERT INTO alert_rules (user_id, type, condition, channel) VALUES ($1,$2,$3,$4) RETURNING *`,
      [user_id, type, condition, channel]
    )
  ).rows[0];
};

export const updateAlertRule = async ({ id, ...data }) => {
  // Only update fields present
  const fields = [];
  const params = [];
  let idx = 1;
  for (let k in data) {
    fields.push(`${k}=$${idx++}`);
    params.push(data[k]);
  }
  params.push(id);
  return (
    await db.query(`UPDATE alert_rules SET ${fields.join(',')} WHERE id=$${idx} RETURNING *`, params)
  ).rows[0];
};

export const deleteAlertRule = async ({ id, user_id }) =>
  (await db.query('DELETE FROM alert_rules WHERE id=$1 AND user_id=$2 RETURNING *', [id, user_id])).rows[0];

// Notification logs
export const getNotificationLogs = async ({ user_id }) =>
  (await db.query('SELECT * FROM notification_logs WHERE user_id=$1 ORDER BY sent_at DESC', [user_id])).rows;

export const logNotification = async ({ user_id, alert_rule_id, message, channel, status }) =>
  (await db.query(
    `INSERT INTO notification_logs (user_id, alert_rule_id, message, channel, status) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [user_id, alert_rule_id, message, channel, status]
  )).rows[0];