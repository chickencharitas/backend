import db from '../config/db.js';
import { sendEmail, sendPush, sendSMS } from '../utils/sendReminder.js';

// Evaluate a single condition object, return true/false
async function evaluateCondition(cond, user_id) {
  if (cond.type === "low_inventory") {
    const items = (await db.query('SELECT id FROM consumables WHERE quantity <= $1', [cond.stock_below])).rows;
    return items.length > 0;
  }
  if (cond.type === "overdue_task") {
    const tasks = (await db.query('SELECT id FROM tasks WHERE status=$1 AND assigned_to=$2', ['overdue', user_id])).rows;
    return tasks.length > 0;
  }
  // Add more conditions as needed
  return false;
}

// Execute a single action object
async function executeAction(action, user) {
  if (action.type === "send_email") {
    await sendEmail({ to: action.to || user.email, subject: action.subject || "Alert", text: action.body });
  }
  if (action.type === "send_push" && user.push_sub) {
    await sendPush({ subscription: JSON.parse(user.push_sub), title: action.title || "Alert", body: action.body });
  }
  if (action.type === "create_task") {
    await db.query(
      `INSERT INTO tasks (title, description, assigned_to, due_date, type, created_by) VALUES ($1,$2,$3,$4,$5,$6)`,
      [action.title, action.description, user.id, action.due_date, action.task_type, user.id]
    );
  }
  // Add more actions as needed
}

// Main chain executor
export async function executeRuleChains() {
  const users = (await db.query('SELECT * FROM users')).rows;
  for (const user of users) {
    const rules = (await db.query('SELECT * FROM alert_rules WHERE user_id=$1 AND is_active=TRUE', [user.id])).rows;
    for (const rule of rules) {
      let trigger = await evaluateCondition(rule.condition, user.id);
      if (trigger && rule.chain) {
        for (const action of rule.chain) {
          await executeAction(action, user);
        }
      }
    }
  }
}