CREATE TABLE business_partners (
  id SERIAL PRIMARY KEY,
  type VARCHAR(12) NOT NULL, -- 'customer', 'supplier'
  name VARCHAR(64) NOT NULL,
  email VARCHAR(128),
  phone VARCHAR(32),
  address TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sale_orders (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES business_partners(id) ON DELETE SET NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(16) DEFAULT 'pending',
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT
);

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES business_partners(id) ON DELETE SET NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(16) DEFAULT 'pending',
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT
);

CREATE TABLE sale_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES sale_orders(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id),
  description VARCHAR(128),
  quantity NUMERIC(10,2),
  unit_price NUMERIC(10,2),
  total NUMERIC(12,2)
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id),
  description VARCHAR(128),
  quantity NUMERIC(10,2),
  unit_price NUMERIC(10,2),
  total NUMERIC(12,2)
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_type VARCHAR(8) NOT NULL, -- 'sale', 'purchase'
  order_id INTEGER NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  method VARCHAR(32),
  notes TEXT
);