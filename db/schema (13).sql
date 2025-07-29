-- Audit log for all sensitive/system actions
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64),
  target_id INTEGER,
  meta JSONB,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Security events: failed logins, suspicious activity, etc.
CREATE TABLE security_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(64) NOT NULL,
  details TEXT,
  ip_address VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance: data retention, export, and access requests
CREATE TABLE compliance_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(32) NOT NULL, -- 'export', 'delete', 'access'
  status VARCHAR(16) DEFAULT 'pending', -- pending, approved, rejected, completed
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);