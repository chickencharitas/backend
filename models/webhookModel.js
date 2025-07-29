import db from '../config/db.js';

export const getWebhooks = async (user_id) =>
  (await db.query('SELECT * FROM alert_webhooks WHERE user_id=$1 ORDER BY id DESC', [user_id])).rows;

export const addWebhook = async (user_id, data) => {
  const { url, secret, event_type } = data;
  return (await db.query(
    `INSERT INTO alert_webhooks (user_id, url, secret, event_type) VALUES ($1,$2,$3,$4) RETURNING *`,
    [user_id, url, secret, event_type]
  )).rows[0];
};

export const updateWebhook = async (id, user_id, data) => {
  const { url, secret, event_type } = data;
  return (await db.query(
    `UPDATE alert_webhooks SET url=$1, secret=$2, event_type=$3 WHERE id=$4 AND user_id=$5 RETURNING *`,
    [url, secret, event_type, id, user_id]
  )).rows[0];
};

export const deleteWebhook = async (id, user_id) =>
  (await db.query('DELETE FROM alert_webhooks WHERE id=$1 AND user_id=$2 RETURNING *', [id, user_id])).rows[0];