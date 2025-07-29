CREATE TABLE breeding_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE breeding_group_members (
  group_id INTEGER REFERENCES breeding_groups(id) ON DELETE CASCADE,
  chicken_id INTEGER REFERENCES chickens(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL, -- e.g. 'male', 'female'
  PRIMARY KEY (group_id, chicken_id)
);

CREATE TABLE breedings (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES breeding_groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT
);

CREATE TABLE egg_records (
  id SERIAL PRIMARY KEY,
  breeding_id INTEGER REFERENCES breedings(id) ON DELETE CASCADE,
  egg_code VARCHAR(32),
  laid_at TIMESTAMP,
  collected_at TIMESTAMP,
  fertile BOOLEAN,
  hatched BOOLEAN,
  chick_id INTEGER REFERENCES chickens(id) -- filled if hatched
);

CREATE TABLE pedigrees (
  chicken_id INTEGER PRIMARY KEY REFERENCES chickens(id),
  father_id INTEGER REFERENCES chickens(id),
  mother_id INTEGER REFERENCES chickens(id)
);

-- Breeding goals/plans
CREATE TABLE breeding_goals (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES breeding_groups(id) ON DELETE CASCADE,
  trait VARCHAR(64),
  goal_value VARCHAR(64),
  notes TEXT
);