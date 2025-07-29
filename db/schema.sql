-- Core tables for Module 2

CREATE TABLE farms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE facilities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g., "breeding pen", "hatchery", "grow-out", "quarantine"
  capacity INTEGER,
  farm_id INTEGER NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE facility_users (
  facility_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (facility_id, user_id)
);