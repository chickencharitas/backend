-- Egg production log
CREATE TABLE egg_productions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  flock_id INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
  collected INTEGER NOT NULL,
  broken INTEGER DEFAULT 0,
  abnormal INTEGER DEFAULT 0,
  notes TEXT
);

-- Hatch event log
CREATE TABLE hatch_events (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES egg_batches(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  total_eggs INTEGER NOT NULL,
  hatched INTEGER NOT NULL,
  dead_in_shell INTEGER DEFAULT 0,
  culled INTEGER DEFAULT 0,
  notes TEXT
);

-- Chick survival
CREATE TABLE chick_survivals (
  id SERIAL PRIMARY KEY,
  hatch_event_id INTEGER REFERENCES hatch_events(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  alive INTEGER,
  dead INTEGER,
  culled INTEGER,
  notes TEXT
);

-- Growth/weights (per chicken or sample)
CREATE TABLE growth_logs (
  id SERIAL PRIMARY KEY,
  chicken_id INTEGER REFERENCES chickens(id) ON DELETE SET NULL,
  flock_id INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  weight NUMERIC(8,3),
  notes TEXT
);

-- Feed conversion logs
CREATE TABLE feed_conversion_logs (
  id SERIAL PRIMARY KEY,
  flock_id INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  feed_consumed NUMERIC(12,3), -- kg
  weight_gain NUMERIC(12,3), -- kg
  notes TEXT
);

-- Genetic trait logs (optional/advanced)
CREATE TABLE genetic_traits (
  id SERIAL PRIMARY KEY,
  chicken_id INTEGER REFERENCES chickens(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  trait VARCHAR(32),
  value VARCHAR(32),
  notes TEXT
);