CREATE TABLE vaccines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT
);

CREATE TABLE treatments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT
);

CREATE TABLE health_events (
  id SERIAL PRIMARY KEY,
  chicken_id INTEGER REFERENCES chickens(id) ON DELETE CASCADE,
  flock_id INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
  event_type VARCHAR(16) NOT NULL, -- vaccination, treatment, disease, inspection, mortality, culling
  event_date DATE NOT NULL,
  details TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE health_event_vaccines (
  event_id INTEGER REFERENCES health_events(id) ON DELETE CASCADE,
  vaccine_id INTEGER REFERENCES vaccines(id) ON DELETE CASCADE,
  scheduled BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (event_id, vaccine_id)
);

CREATE TABLE health_event_treatments (
  event_id INTEGER REFERENCES health_events(id) ON DELETE CASCADE,
  treatment_id INTEGER REFERENCES treatments(id) ON DELETE CASCADE,
  dosage VARCHAR(32),
  duration VARCHAR(32),
  PRIMARY KEY (event_id, treatment_id)
);

CREATE TABLE disease_outbreaks (
  id SERIAL PRIMARY KEY,
  disease VARCHAR(64),
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  affected_flock_ids INTEGER[],
  notes TEXT
);

-- Index for quick search/filtering
CREATE INDEX idx_health_events_chicken_id ON health_events(chicken_id);
CREATE INDEX idx_health_events_flock_id ON health_events(flock_id);