CREATE TABLE feed_batches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  supplier VARCHAR(64),
  received_date DATE NOT NULL,
  quantity NUMERIC(12,2) NOT NULL,
  unit VARCHAR(12) NOT NULL,
  cost NUMERIC(12,2),
  expiry_date DATE,
  notes TEXT
);

CREATE TABLE feedings (
  id SERIAL PRIMARY KEY,
  flock_id INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  feed_batch_id INTEGER REFERENCES feed_batches(id),
  ration VARCHAR(64),
  quantity NUMERIC(12,2),
  unit VARCHAR(12),
  notes TEXT
);

CREATE TABLE feeding_schedules (
  id SERIAL PRIMARY KEY,
  flock_id INTEGER REFERENCES flocks(id) ON DELETE CASCADE,
  feed_batch_id INTEGER REFERENCES feed_batches(id),
  schedule_type VARCHAR(24), -- e.g. by age, breed
  start_age_days INTEGER,
  end_age_days INTEGER,
  ration VARCHAR(64),
  quantity_per_day NUMERIC(12,2),
  unit VARCHAR(12),
  notes TEXT
);