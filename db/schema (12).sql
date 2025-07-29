CREATE TABLE alert_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL, -- e.g. low_inventory, overdue_task, custom
  condition JSONB,           -- e.g. {"stock_below":10}, {"task_status":"overdue"}
  channel VARCHAR(16)[],     -- e.g. ['in-app','email','push']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  alert_rule_id INTEGER REFERENCES alert_rules(id),
  message TEXT,
  channel VARCHAR(16), -- email, sms, push, in-app
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(16) DEFAULT 'sent'
);