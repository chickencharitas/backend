-- Tasks (feeding, cleaning, treatments, etc.)
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  due_time TIME,
  status VARCHAR(16) DEFAULT 'pending', -- pending, in_progress, done, overdue
  priority VARCHAR(12) DEFAULT 'normal', -- low, normal, high
  type VARCHAR(32), -- feeding, cleaning, treatment, etc.
  related_id INTEGER, -- e.g., chicken_id, flock_id, etc. (nullable)
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Calendar events (breeding, hatching, vaccinations)
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  type VARCHAR(32),
  related_id INTEGER, -- e.g., flock_id, chicken_id, etc.
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts (system-triggered: low inventory, due vaccinations, etc.)
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(24), -- low_inventory, upcoming_event, due_vaccination, etc.
  related_id INTEGER,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reminders (email, SMS, in-app)
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  remind_at TIMESTAMP NOT NULL,
  channel VARCHAR(16) DEFAULT 'in-app', -- in-app, email, sms
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);