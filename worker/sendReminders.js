import cron from "node-cron";
import db from "../config/db.js";
import { sendEmail, sendSMS, sendWhatsApp, sendPush } from "../utils/sendReminder.js";

// Every minute, check for due reminders in the next 5 minutes
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 5*60*1000);
  const res = await db.query(
    `SELECT r.*, t.title, t.description, u.email, u.phone, u.push_sub
     FROM reminders r
     JOIN tasks t ON r.task_id = t.id
     JOIN users u ON r.user_id = u.id
     WHERE r.sent = FALSE AND r.remind_at <= $1`,
    [soon]
  );
  for (const r of res.rows) {
    const msg = `Reminder: ${r.title}\n${r.description || ""}`;
    if (r.channel === "email" && r.email) await sendEmail({ to: r.email, subject: "Task Reminder", text: msg });
    if (r.channel === "sms" && r.phone) await sendSMS({ to: r.phone, text: msg });
    if (r.channel === "whatsapp" && r.phone) await sendWhatsApp({ to: r.phone, text: msg });
    if (r.channel === "push" && r.push_sub) await sendPush({ subscription: JSON.parse(r.push_sub), title: "Task Reminder", body: msg });
    await db.query("UPDATE reminders SET sent = TRUE WHERE id = $1", [r.id]);
  }
  console.log(`Reminders sent at ${now.toISOString()}: ${res.rows.length}`);
});