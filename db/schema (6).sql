CREATE TABLE inventory_locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE item_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(32) UNIQUE NOT NULL
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(64) NOT NULL,
  type_id INTEGER REFERENCES item_types(id),
  unit VARCHAR(16) NOT NULL,
  conversion_factor NUMERIC(8,3) DEFAULT 1, -- for alt units
  description TEXT
);

CREATE TABLE inventory_batches (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES inventory_locations(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL,
  unit VARCHAR(16) NOT NULL,
  batch_code VARCHAR(32),
  expiry_date DATE,
  lot_number VARCHAR(32),
  received_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES inventory_batches(id) ON DELETE CASCADE,
  movement_type VARCHAR(12) NOT NULL, -- in, out, transfer
  quantity NUMERIC(12,3) NOT NULL,
  from_location_id INTEGER REFERENCES inventory_locations(id),
  to_location_id INTEGER REFERENCES inventory_locations(id),
  date TIMESTAMP DEFAULT NOW(),
  notes TEXT
);