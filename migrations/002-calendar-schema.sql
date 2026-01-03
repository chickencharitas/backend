-- ============================================================
-- TEAM CALENDARS
-- ============================================================

CREATE TABLE IF NOT EXISTS team_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#1976d2',
  timezone VARCHAR(50) DEFAULT 'UTC',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_team_calendars_org ON team_calendars(organization_id);
CREATE INDEX idx_team_calendars_created_by ON team_calendars(created_by);
CREATE INDEX idx_team_calendars_active ON team_calendars(is_active);

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES team_calendars(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location VARCHAR(255),
  event_type VARCHAR(50) DEFAULT 'meeting',
  recurrence VARCHAR(50) DEFAULT 'none',
  reminder_minutes INTEGER DEFAULT 15,
  is_all_day BOOLEAN DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  recurring_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX idx_calendar_events_calendar ON calendar_events(calendar_id);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX idx_calendar_events_recurring ON calendar_events(recurring_event_id);
CREATE INDEX idx_calendar_events_cancelled ON calendar_events(is_cancelled);

-- ============================================================
-- EVENT ATTENDEES
-- ============================================================

CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'invited',
  responded_at TIMESTAMP,
  response_notes TEXT,
  is_organizer BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX idx_event_attendees_status ON event_attendees(status);

-- ============================================================
-- CALENDAR SHARES
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES team_calendars(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level VARCHAR(50) DEFAULT 'view',
  shared_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(calendar_id, shared_with_user_id)
);

CREATE INDEX idx_calendar_shares_calendar ON calendar_shares(calendar_id);
CREATE INDEX idx_calendar_shares_shared_with ON calendar_shares(shared_with_user_id);
CREATE INDEX idx_calendar_shares_permission ON calendar_shares(permission_level);

-- ============================================================
-- CALENDAR REMINDERS
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP NOT NULL,
  reminder_type VARCHAR(50) DEFAULT 'email',
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id, reminder_time)
);

CREATE INDEX idx_calendar_reminders_event ON calendar_reminders(event_id);
CREATE INDEX idx_calendar_reminders_user ON calendar_reminders(user_id);
CREATE INDEX idx_calendar_reminders_time ON calendar_reminders(reminder_time);
CREATE INDEX idx_calendar_reminders_sent ON calendar_reminders(is_sent);

-- ============================================================
-- EVENT CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_event_categories_org ON event_categories(organization_id);
CREATE INDEX idx_event_categories_active ON event_categories(is_active);

-- ============================================================
-- EVENT-CATEGORY MAPPING
-- ============================================================

CREATE TABLE IF NOT EXISTS event_category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES event_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, category_id)
);

CREATE INDEX idx_event_categories_mapping_event ON event_category_mappings(event_id);
CREATE INDEX idx_event_categories_mapping_category ON event_category_mappings(category_id);

-- ============================================================
-- CALENDAR SYNC (External integrations)
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_syncs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES team_calendars(id) ON DELETE CASCADE,
  external_calendar_type VARCHAR(50),
  external_calendar_id VARCHAR(255),
  external_calendar_token TEXT,
  last_synced_at TIMESTAMP,
  is_syncing BOOLEAN DEFAULT false,
  sync_direction VARCHAR(50) DEFAULT 'bidirectional',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(calendar_id, external_calendar_type)
);

CREATE INDEX idx_calendar_syncs_calendar ON calendar_syncs(calendar_id);
CREATE INDEX idx_calendar_syncs_type ON calendar_syncs(external_calendar_type);

-- ============================================================
-- EVENT ATTACHMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS event_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_attachments_event ON event_attachments(event_id);
CREATE INDEX idx_event_attachments_uploaded_by ON event_attachments(uploaded_by);

-- ============================================================
-- EVENT COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_comments_event ON event_comments(event_id);
CREATE INDEX idx_event_comments_user ON event_comments(user_id);

-- ============================================================
-- CALENDAR ACTIVITY LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES team_calendars(id) ON DELETE CASCADE,
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(50),
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_activity_logs_calendar ON calendar_activity_logs(calendar_id);
CREATE INDEX idx_calendar_activity_logs_event ON calendar_activity_logs(event_id);
CREATE INDEX idx_calendar_activity_logs_user ON calendar_activity_logs(user_id);
CREATE INDEX idx_calendar_activity_logs_type ON calendar_activity_logs(activity_type);
CREATE INDEX idx_calendar_activity_logs_created ON calendar_activity_logs(created_at DESC);

-- ============================================================
-- CALENDAR PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  calendar_id UUID NOT NULL REFERENCES team_calendars(id) ON DELETE CASCADE,
  is_hidden BOOLEAN DEFAULT false,
  notification_enabled BOOLEAN DEFAULT true,
  notification_type VARCHAR(50) DEFAULT 'email',
  reminder_minutes INTEGER DEFAULT 15,
  color_override VARCHAR(7),
  display_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, calendar_id)
);

CREATE INDEX idx_calendar_preferences_user ON calendar_preferences(user_id);
CREATE INDEX idx_calendar_preferences_calendar ON calendar_preferences(calendar_id);

-- ============================================================
-- AUDIO MIXES
-- ============================================================

CREATE TABLE IF NOT EXISTS audio_mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  input_files JSONB,
  output_file VARCHAR(500),
  mix_type VARCHAR(50),
  effects_applied JSONB,
  track_settings JSONB,
  ducking_amount DECIMAL(3, 2),
  target_loudness DECIMAL(5, 2),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audio_mixes_org ON audio_mixes(organization_id);
CREATE INDEX idx_audio_mixes_type ON audio_mixes(mix_type);
CREATE INDEX idx_audio_mixes_created_by ON audio_mixes(created_by);
CREATE INDEX idx_audio_mixes_created ON audio_mixes(created_at DESC);

-- ============================================================
-- MASTER NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),
  related_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  related_calendar_id UUID REFERENCES team_calendars(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_related_event ON notifications(related_event_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);