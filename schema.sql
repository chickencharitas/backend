-- == RBAC/User Foundation for Cell Ministry Management Platform ==

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
  ('pastor'),
  ('zonal_leader'),
  ('cell_leader'),
  ('member');

-- PERMISSIONS
INSERT INTO permissions (name) VALUES
  ('view_roles'),
  ('create_role'),
  ('update_role'),
  ('delete_role'),
  ('view_permissions'),
  ('create_permission'),
  ('update_permission'),
  ('delete_permission'),
  ('view_users'),
  ('assign_role'),
  ('remove_role'),
  ('view_profile'),
  ('view_user_roles');

-- USERS (password_hash is a bcrypt hash of "password" for dev)
-- You may want to change these emails/phones for your dev environment.
INSERT INTO users (name, email, phone, password_hash, phone_verified, status)
VALUES
  ('Super Admin', 'admin@church.com', '0771000001', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', TRUE, 'active'),
  ('Pastor John', 'pastor@church.com', '0771000002', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', TRUE, 'active'),
  ('Zonal Leader Kate', 'zone@church.com', '0771000003', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', FALSE, 'active'),
  ('Cell Leader Sam', 'cell@church.com', '0771000004', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', FALSE, 'active'),
  ('Member Joy', 'member@church.com', '0771000005', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36v3z3pTg9xI4eG2S7JpJ5u', FALSE, 'active');

-- USER_ROLES
INSERT INTO user_roles (user_id, role_id) VALUES
  (1, 1), -- Super Admin is admin
  (2, 2), -- Pastor John is pastor
  (3, 3), -- Zonal Leader Kate is zonal_leader
  (4, 4), -- Cell Leader Sam is cell_leader
  (5, 5); -- Member Joy is member

-- ROLE_PERMISSIONS (expand as needed for RBAC granularity)
-- ROLE_PERMISSIONS (expand as needed for RBAC granularity)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  -- Admin full access
  (1, 1),  -- view_roles
  (1, 2),  -- create_role
  (1, 3),  -- update_role
  (1, 4),  -- delete_role
  (1, 5),  -- view_permissions
  (1, 6),  -- create_permission
  (1, 7),  -- update_permission
  (1, 8),  -- delete_permission
  (1, 9),  -- view_users
  (1, 10), -- assign_role
  (1, 11), -- remove_role
  (1, 12), -- view_profile
  (1, 13), -- view_user_roles

  -- Pastor (example: can view roles, users, and assign roles)
  (2, 1),  -- view_roles
  (2, 5),  -- view_permissions
  (2, 9),  -- view_users
  (2, 10), -- assign_role
  (2, 12), -- view_profile
  (2, 13), -- view_user_roles

  -- Zonal Leader (example: can view roles and users)
  (3, 1),  -- view_roles
  (3, 5),  -- view_permissions
  (3, 9),  -- view_users
  (3, 12), -- view_profile
  (3, 13), -- view_user_roles

  -- Cell Leader (example: can view users and profile)
  (4, 9),  -- view_users
  (4, 12), -- view_profile
  (4, 13), -- view_user_roles

  -- Member (example: can only view their profile)
  (5, 12); -- view_profile