-- Consumables (feed, vaccines, medicine, bedding, etc.)
CREATE TABLE consumables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  type VARCHAR(24) NOT NULL, -- feed, vaccine, medicine, bedding, etc.
  quantity NUMERIC(12,2) DEFAULT 0,
  unit VARCHAR(12),
  reorder_level NUMERIC(12,2) DEFAULT 0,
  notes TEXT
);

-- Equipment (incubators, feeders, waterers, etc.)
CREATE TABLE equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  type VARCHAR(24),
  status VARCHAR(24) DEFAULT 'available', -- available, in-use, maintenance, retired
  purchase_date DATE,
  location VARCHAR(64),
  assigned_to VARCHAR(64),
  notes TEXT
);