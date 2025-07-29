-- Chicken & Flock Management

CREATE TABLE breeds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE chickens (
  id SERIAL PRIMARY KEY,
  unique_tag VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(64),
  breed_id INTEGER REFERENCES breeds(id),
  sex VARCHAR(8),
  color VARCHAR(32),
  hatch_date DATE,
  source VARCHAR(64),
  generation INTEGER,
  genetic_line VARCHAR(64),
  weight NUMERIC(6,2),
  health_status VARCHAR(128),
  vaccination_status VARCHAR(128),
  farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
  facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
  flock_id INTEGER REFERENCES flocks(id) ON DELETE SET NULL,
  alive BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE flocks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE flock_chickens (
  flock_id INTEGER REFERENCES flocks(id) ON DELETE CASCADE,
  chicken_id INTEGER REFERENCES chickens(id) ON DELETE CASCADE,
  PRIMARY KEY (flock_id, chicken_id)
);

CREATE TABLE culling_mortality (
  id SERIAL PRIMARY KEY,
  chicken_id INTEGER REFERENCES chickens(id),
  flock_id INTEGER REFERENCES flocks(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type VARCHAR(16) NOT NULL, -- 'cull' or 'mortality'
  reason TEXT,
  notes TEXT
);