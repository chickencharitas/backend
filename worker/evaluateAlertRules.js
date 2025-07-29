import db from '../config/db.js';
import { logNotification } from '../models/alertRuleModel.js';
import { sendEmail, sendPush, sendSMS } from '../utils/sendReminder.js';

export async function evaluateAlertRulesForAllUsers() {
  const users = (await db.query('SELECT id FROM users')).rows;
  for (const u of users) {
    const rules = (await db.query('SELECT * FROM alert_rules WHERE user_id=$1 AND is_active=TRUE', [u.id])).rows;
    for (const rule of rules) {
      let shouldTrigger = false;
      let message = "";
      // Example: low inventory
      if (rule.type === "low_inventory") {
        const items = (await db.query('SELECT name, quantity FROM consumables WHERE quantity <= $1', [rule.condition?.stock_below || 0])).rows;
        if (items.length > 0) {
          shouldTrigger = true;
          message = `Low stock: ${items.map(i => `${i.name} (${i.quantity})`).join(', ')}`;
        }
      }
      // Add other rule types here (overdue_task, custom, etc.)

      if (shouldTrigger) {
        for (const ch of rule.channel) {
          if (ch === "email") await sendEmail({ to: u.email, subject: "Alert", text: message });
          if (ch === "push" && u.push_sub) await sendPush({ subscription: JSON.parse(u.push_sub), title: "Alert", body: message });
          if (ch === "sms" && u.phone) await sendSMS({ to: u.phone, text: message });
          await logNotification({ user_id: u.id, alert_rule_id: rule.id, message, channel: ch, status: 'sent' });
        }
      }
    }
  }
}