-- == RBAC/User Foundation for Multi-Booking Platform ==

-- DROP TABLES (safe for dev)
DROP TABLE IF EXISTS otps, password_resets, role_permissions, user_roles, users, roles, permissions CASCADE;

-- ROLES
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- PERMISSIONS
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_url TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- USER ROLES (Many-to-Many)
CREATE TABLE user_roles (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

-- ROLE PERMISSIONS (Many-to-Many)
CREATE TABLE role_permissions (
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- PASSWORD RESET TOKENS
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- OTP TABLE (for phone verification, 2FA, etc.)
CREATE TABLE otps (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE
);

-- == SEED DATA ==

-- ROLES
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('venue_manager'),
  ('promoter'),
  ('agent'),
  ('user');

-- PERMISSIONS
INSERT INTO permissions (name) VALUES
  ('manage_users'),
  ('manage_roles'),
  ('manage_permissions'),
  ('view_reports'),
  ('manage_venues'),
  ('manage_events'),
  ('manage_tickets'),
  ('book_tickets'),
  ('view_events'),
  ('validate_tickets'),
  ('manage_profile');

-- USERS (password_hash is a bcrypt hash of "password" for dev)
INSERT INTO users (name, email, phone, password_hash, phone_verified, status)
VALUES
  ('Super Admin', 'admin@example.com', '0771000001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', TRUE, 'active'),
  ('Venue Manager', 'venue@example.com', '0771000002', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', TRUE, 'active'),
  ('Promoter ZimLive', 'promoter@example.com', '0771000003', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', FALSE, 'active'),
  ('AgentX', 'agent@example.com', '0771000004', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', FALSE, 'active'),
  ('Regular User', 'user@example.com', '0771000005', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', FALSE, 'active');

-- USER_ROLES
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1), -- Super Admin is admin
  (2, 2), -- Venue Manager is venue_manager
  (3, 3), -- Promoter is promoter
  (4, 4), -- AgentX is agent
  (5, 5); -- Regular User is user

-- ROLE_PERMISSIONS (sample - expand as needed)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  (1, 1),  -- admin: manage_users
  (1, 2),  -- admin: manage_roles
  (1, 3),  -- admin: manage_permissions
  (1, 4),  -- admin: view_reports
  (1, 5),  -- admin: manage_venues
  (1, 6),  -- admin: manage_events
  (1, 7),  -- admin: manage_tickets
  (1, 8),  -- admin: book_tickets
  (1, 9),  -- admin: view_events
  (1, 10), -- admin: validate_tickets
  (1, 11), -- admin: manage_profile
  (2, 5),  -- venue_manager: manage_venues
  (2, 6),  -- venue_manager: manage_events
  (2, 7),  -- venue_manager: manage_tickets
  (2, 4),  -- venue_manager: view_reports
  (2, 9),  -- venue_manager: view_events
  (2, 11), -- venue_manager: manage_profile
  (3, 6),  -- promoter: manage_events
  (3, 7),  -- promoter: manage_tickets
  (3, 9),  -- promoter: view_events
  (3, 11), -- promoter: manage_profile
  (4, 7),  -- agent: manage_tickets
  (4, 9),  -- agent: view_events
  (4, 11), -- agent: manage_profile
  (5, 8),  -- user: book_tickets
  (5, 9),  -- user: view_events
  (5, 11); -- user: manage_profile



