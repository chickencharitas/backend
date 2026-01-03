-- Enable UUID creation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";



/* ============================================================
   ORGANIZATIONS
============================================================ */
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo VARCHAR(500),
  tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   USERS
============================================================ */
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'volunteer',
  profile_image VARCHAR(500),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   USER SETTINGS
============================================================ */
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  theme VARCHAR(50) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  notifications BOOLEAN DEFAULT true,
  auto_save BOOLEAN DEFAULT true,
  default_scripture_translation VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   ORGANIZATION SETTINGS
============================================================ */
CREATE TABLE organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  organization_name VARCHAR(255),
  logo VARCHAR(500),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  ccli_id VARCHAR(100),
  ccli_account VARCHAR(100),
  maintenance_mode BOOLEAN DEFAULT false,
  api_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   DISPLAY SETTINGS
============================================================ */
CREATE TABLE display_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  main_display JSONB,
  stage_monitor JSONB,
  livestream_resolution VARCHAR(50),
  recording_resolution VARCHAR(50),
  output_count INTEGER DEFAULT 1,
  ndi_enabled BOOLEAN DEFAULT false,
  ndi_names JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   PRESENTATIONS
============================================================ */
CREATE TABLE presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  created_by UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   PRESENTATION SLIDES
============================================================ */
CREATE TABLE presentation_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT,
  layout VARCHAR(50),
  background VARCHAR(500),
  slide_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   MEDIA
============================================================ */
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  filename VARCHAR(255),
  original_name VARCHAR(255),
  type VARCHAR(50),
  size BIGINT,
  mimetype VARCHAR(100),
  path VARCHAR(500),
  thumbnail_path VARCHAR(500),
  category VARCHAR(100),
  tags JSONB,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   SLIDE MEDIA
============================================================ */
CREATE TABLE slide_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES presentation_slides(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id),
  created_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   SONGS / LYRICS LIBRARY
============================================================ */
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  lyrics TEXT,
  ccli_number VARCHAR(50),
  ccli_publisher VARCHAR(255),
  duration INTEGER,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   SCRIPTURE VERSES
============================================================ */
CREATE TABLE scripture_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book VARCHAR(100),
  chapter INTEGER,
  verse INTEGER,
  reference VARCHAR(255),
  content TEXT,
  translation VARCHAR(50),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   PLAYLISTS
============================================================ */
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  service_date DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   PLAYLIST ITEMS
============================================================ */
CREATE TABLE playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  type VARCHAR(50),
  presentation_id UUID REFERENCES presentations(id),
  song_id UUID REFERENCES songs(id),
  scripture_id UUID REFERENCES scripture_verses(id),
  video_id UUID REFERENCES media(id),
  duration INTEGER,
  notes TEXT,
  item_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   PLAYLIST HISTORY
============================================================ */
CREATE TABLE playlist_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  event_type VARCHAR(50),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   INTEGRATION CREDENTIALS
============================================================ */
CREATE TABLE integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  integration_type VARCHAR(50) NOT NULL,
  credentials JSONB,
  enabled BOOLEAN DEFAULT true,
  last_tested_at TIMESTAMP,
  last_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, integration_type)
);



/* ============================================================
   REPORTS
============================================================ */
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  report_type VARCHAR(50),
  data JSONB,
  format VARCHAR(50),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   AUDIT LOG
============================================================ */
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   USER INVITATIONS
============================================================ */
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  expires_at TIMESTAMP,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   SUBSCRIPTIONS
============================================================ */
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  tier VARCHAR(50) DEFAULT 'free',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  renewal_date TIMESTAMP,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);



/* ============================================================
   MEDIA EDITS
============================================================ */
CREATE TABLE media_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  edit_type VARCHAR(30) CHECK (edit_type IN ('image_edit', 'video_trim', 'audio_mix', 'watermark')),
  params JSONB,
  result_path VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   WATERMARKS (optional, for storing watermark images)
============================================================ */
CREATE TABLE watermarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   COLLABORATIVE SESSIONS
============================================================ */
CREATE TABLE collaborative_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE session_participants (
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (session_id, user_id)
);

/* ============================================================
   MEDIA COMMENTS
============================================================ */
CREATE TABLE media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   MEDIA ANNOTATIONS
============================================================ */
CREATE TABLE media_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  annotation JSONB, -- e.g. {x: 100, y: 200, text: "Highlight"}
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   MEDIA APPROVALS
============================================================ */
CREATE TABLE media_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES users(id),
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  comment TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  responded_at TIMESTAMP
);

/* ============================================================
   MEDIA VERSIONS
============================================================ */
CREATE TABLE media_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  file_url VARCHAR(512) NOT NULL,
  change_summary TEXT
);

-- Index for fast lookup
CREATE INDEX idx_media_versions_media ON media_versions(media_id);

-- Add indexes for faster queries if needed
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_presentations_organization ON presentations(organization_id);
CREATE INDEX idx_media_organization ON media(organization_id);
CREATE INDEX idx_playlists_organization ON playlists(organization_id);
CREATE INDEX idx_playlist_items_playlist ON playlist_items(playlist_id);
CREATE INDEX idx_slide_media ON slide_media(media_id);
CREATE INDEX idx_scripture_verses_book ON scripture_verses(book);
CREATE INDEX idx_audit_log_organization ON audit_log(organization_id);
CREATE INDEX idx_media_edits_media ON media_edits(media_id);
CREATE INDEX idx_media_edits_user ON media_edits(user_id);

/* ============================================================
   TEAM CALENDARS
============================================================ */
CREATE TABLE team_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES team_calendars(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   STREAMING PLATFORMS
============================================================ */
CREATE TABLE streaming_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'youtube', 'twitch')),
  api_key VARCHAR(500) NOT NULL,
  api_secret VARCHAR(500),
  access_token VARCHAR(1000),
  refresh_token VARCHAR(1000),
  channel_id VARCHAR(255),
  channel_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, platform)
);

/* ============================================================
   LIVE STREAMS
============================================================ */
CREATE TABLE live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  stream_key VARCHAR(255) UNIQUE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'live', 'ended', 'archived')) DEFAULT 'scheduled',
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  scheduled_at TIMESTAMP,
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  thumbnail_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   STREAM BROADCASTS (multi-platform)
============================================================ */
CREATE TABLE stream_broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES streaming_platforms(id) ON DELETE CASCADE,
  platform_stream_id VARCHAR(255),
  broadcast_url VARCHAR(500),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'live', 'ended', 'failed')) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (stream_id, platform_id)
);

/* ============================================================
   CHAT MESSAGES (aggregated from all platforms)
============================================================ */
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('facebook', 'youtube', 'twitch', 'internal')),
  platform_user_id VARCHAR(255),
  username VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  user_avatar_url VARCHAR(500),
  is_moderated BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   CHAT MODERATION
============================================================ */
CREATE TABLE chat_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  moderated_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) CHECK (action IN ('delete', 'mute', 'timeout', 'ban')),
  reason TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   VIEWER ANALYTICS
============================================================ */
CREATE TABLE viewer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  platform VARCHAR(50),
  peak_viewers INTEGER,
  total_unique_viewers INTEGER,
  total_chat_messages INTEGER,
  average_watch_time_minutes INTEGER,
  engagement_rate DECIMAL(5, 2),
  retention_percentage DECIMAL(5, 2),
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   VIEWER TIMELINE (for tracking viewer count over time)
============================================================ */
CREATE TABLE viewer_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  viewer_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   RECORDINGS
============================================================ */
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_name VARCHAR(255),
  duration_seconds INTEGER,
  file_size BIGINT,
  cdn_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'ready', 'archived', 'failed')) DEFAULT 'processing',
  processing_progress INTEGER DEFAULT 0,
  error_message TEXT,
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   RECORDING FORMATS (for transcoding to different qualities)
============================================================ */
CREATE TABLE recording_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  quality VARCHAR(50) CHECK (quality IN ('360p', '480p', '720p', '1080p', '4k')),
  file_path VARCHAR(500),
  cdn_url VARCHAR(500),
  file_size BIGINT,
  bitrate_kbps INTEGER,
  status VARCHAR(20) DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   CDN PROVIDERS
============================================================ */
CREATE TABLE cdn_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL CHECK (provider_name IN ('cloudflare', 'aws_cloudfront', 'bunny', 'akamai', 'custom')),
  api_key VARCHAR(500),
  api_secret VARCHAR(500),
  endpoint VARCHAR(500),
  bucket_name VARCHAR(255),
  region VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (organization_id, provider_name)
);

/* ============================================================
   STREAM SETTINGS
============================================================ */
CREATE TABLE stream_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  auto_record BOOLEAN DEFAULT true,
  record_quality VARCHAR(50) DEFAULT '1080p',
  enable_chat BOOLEAN DEFAULT true,
  chat_moderation_enabled BOOLEAN DEFAULT true,
  enable_analytics BOOLEAN DEFAULT true,
  retention_days INTEGER DEFAULT 30,
  max_concurrent_streams INTEGER DEFAULT 1,
  allow_viewer_comments BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   STREAM WEBHOOKS
============================================================ */
CREATE TABLE stream_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) CHECK (event_type IN ('stream_started', 'stream_ended', 'recording_ready', 'chat_message', 'viewer_joined', 'viewer_left')),
  webhook_url VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   STREAM PRESETS (for quick stream setup)
============================================================ */
CREATE TABLE stream_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  platforms JSONB NOT NULL, -- e.g. ["youtube", "facebook", "twitch"]
  settings JSONB, -- e.g. {title_template: "", tags: []}
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   INDEXES FOR PERFORMANCE
============================================================ */
CREATE INDEX idx_streaming_platforms_org ON streaming_platforms(organization_id);
CREATE INDEX idx_streaming_platforms_active ON streaming_platforms(organization_id, is_active);
CREATE INDEX idx_live_streams_org ON live_streams(organization_id);
CREATE INDEX idx_live_streams_status ON live_streams(status);
CREATE INDEX idx_live_streams_created ON live_streams(created_at DESC);
CREATE INDEX idx_stream_broadcasts_stream ON stream_broadcasts(stream_id);
CREATE INDEX idx_stream_broadcasts_platform ON stream_broadcasts(platform_id);
CREATE INDEX idx_chat_messages_stream ON chat_messages(stream_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_username ON chat_messages(username);
CREATE INDEX idx_viewer_analytics_stream ON viewer_analytics(stream_id);
CREATE INDEX idx_viewer_timeline_stream ON viewer_timeline(stream_id, timestamp DESC);
CREATE INDEX idx_recordings_org ON recordings(organization_id);
CREATE INDEX idx_recordings_status ON recordings(status);
CREATE INDEX idx_recordings_created ON recordings(created_at DESC);
CREATE INDEX idx_recording_formats_recording ON recording_formats(recording_id);
CREATE INDEX idx_cdn_providers_org ON cdn_providers(organization_id);
CREATE INDEX idx_stream_webhooks_org ON stream_webhooks(organization_id);
CREATE INDEX idx_stream_presets_org ON stream_presets(organization_id);

/* ============================================================
   CAMERA CONTROL SYSTEMS
============================================================ */
CREATE TABLE camera_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  ip_address VARCHAR(15) NOT NULL UNIQUE,
  port INTEGER DEFAULT 5678,
  protocol VARCHAR(50) CHECK (protocol IN ('visca', 'pelco', 'onvif', 'sony', 'panasonic')),
  username VARCHAR(255),
  password VARCHAR(255),
  is_online BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE camera_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES camera_devices(id) ON DELETE CASCADE,
  preset_name VARCHAR(255) NOT NULL,
  pan_position DECIMAL(10, 2),
  tilt_position DECIMAL(10, 2),
  zoom_position DECIMAL(10, 2),
  focus_position DECIMAL(10, 2),
  iris_position DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (camera_id, preset_name)
);

CREATE TABLE camera_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camera_id UUID NOT NULL REFERENCES camera_devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  pan_speed DECIMAL(5, 2),
  tilt_speed DECIMAL(5, 2),
  zoom_speed DECIMAL(5, 2),
  pan_value DECIMAL(10, 2),
  tilt_value DECIMAL(10, 2),
  zoom_value DECIMAL(10, 2)
);

/* ============================================================
   LIGHTING CONTROL (DMX)
============================================================ */
CREATE TABLE dmx_controllers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  ip_address VARCHAR(15),
  usb_port VARCHAR(50),
  connection_type VARCHAR(50) CHECK (connection_type IN ('usb', 'ethernet', 'wifi')) DEFAULT 'usb',
  universes_count INTEGER DEFAULT 1,
  is_online BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dmx_fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dmx_controller_id UUID NOT NULL REFERENCES dmx_controllers(id) ON DELETE CASCADE,
  fixture_name VARCHAR(255) NOT NULL,
  fixture_type VARCHAR(100) CHECK (fixture_type IN ('moving_head', 'par', 'wash', 'spot', 'strobe', 'rgb', 'laser')),
  universe INTEGER NOT NULL,
  start_channel INTEGER NOT NULL,
  channel_count INTEGER NOT NULL,
  mode VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dmx_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dmx_controller_id UUID NOT NULL REFERENCES dmx_controllers(id) ON DELETE CASCADE,
  scene_name VARCHAR(255) NOT NULL,
  description TEXT,
  fade_time_ms INTEGER DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dmx_scene_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES dmx_scenes(id) ON DELETE CASCADE,
  fixture_id UUID NOT NULL REFERENCES dmx_fixtures(id) ON DELETE CASCADE,
  channel_data BYTEA NOT NULL, -- Raw DMX channel values (0-255)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE dmx_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES dmx_scenes(id) ON DELETE CASCADE,
  cue_number DECIMAL(10, 1) NOT NULL,
  description TEXT,
  fade_time_ms INTEGER DEFAULT 1000,
  hold_time_ms INTEGER DEFAULT 0,
  delay_time_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (scene_id, cue_number)
);

/* ============================================================
   AUDIO MIXER CONTROL
============================================================ */
CREATE TABLE audio_mixers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  ip_address VARCHAR(15) NOT NULL UNIQUE,
  port INTEGER DEFAULT 9000,
  protocol VARCHAR(50) CHECK (protocol IN ('osc', 'midi', 'http', 'websocket')),
  is_online BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mixer_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mixer_id UUID NOT NULL REFERENCES audio_mixers(id) ON DELETE CASCADE,
  channel_number INTEGER NOT NULL,
  channel_name VARCHAR(255),
  channel_type VARCHAR(50) CHECK (channel_type IN ('input', 'aux', 'output', 'subgroup')),
  input_source VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (mixer_id, channel_number)
);

CREATE TABLE mixer_faders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES mixer_channels(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  level_db DECIMAL(8, 2),
  mute BOOLEAN DEFAULT false,
  pan DECIMAL(5, 2),
  solo BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mixer_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mixer_id UUID NOT NULL REFERENCES audio_mixers(id) ON DELETE CASCADE,
  scene_name VARCHAR(255) NOT NULL,
  description TEXT,
  fade_time_ms INTEGER DEFAULT 1000,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mixer_scene_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES mixer_scenes(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES mixer_channels(id) ON DELETE CASCADE,
  fader_level DECIMAL(8, 2),
  mute BOOLEAN DEFAULT false,
  pan DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audio_equalizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES mixer_channels(id) ON DELETE CASCADE,
  eq_type VARCHAR(50) CHECK (eq_type IN ('parametric', 'graphic', 'shelving')),
  band_1_freq INTEGER,
  band_1_gain DECIMAL(5, 2),
  band_2_freq INTEGER,
  band_2_gain DECIMAL(5, 2),
  band_3_freq INTEGER,
  band_3_gain DECIMAL(5, 2),
  band_4_freq INTEGER,
  band_4_gain DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audio_compressors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES mixer_channels(id) ON DELETE CASCADE,
  threshold_db DECIMAL(5, 2),
  ratio DECIMAL(3, 1),
  attack_ms DECIMAL(5, 2),
  release_ms DECIMAL(5, 2),
  makeup_gain DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   VIDEO ROUTER CONTROL
============================================================ */
CREATE TABLE video_routers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  ip_address VARCHAR(15) NOT NULL UNIQUE,
  port INTEGER DEFAULT 5000,
  protocol VARCHAR(50) CHECK (protocol IN ('visca', 'rs232', 'rs422', 'ethernet')),
  input_count INTEGER NOT NULL,
  output_count INTEGER NOT NULL,
  is_online BOOLEAN DEFAULT false,
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE router_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  router_id UUID NOT NULL REFERENCES video_routers(id) ON DELETE CASCADE,
  input_number INTEGER NOT NULL,
  input_name VARCHAR(255),
  input_type VARCHAR(50) CHECK (input_type IN ('hdmi', 'sdi', 'dvi', 'vga', 'displayport', 'usb')),
  signal_detected BOOLEAN DEFAULT false,
  resolution VARCHAR(50),
  refresh_rate INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (router_id, input_number)
);

CREATE TABLE router_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  router_id UUID NOT NULL REFERENCES video_routers(id) ON DELETE CASCADE,
  output_number INTEGER NOT NULL,
  output_name VARCHAR(255),
  output_type VARCHAR(50) CHECK (output_type IN ('hdmi', 'sdi', 'dvi', 'vga', 'displayport', 'usb')),
  current_input INTEGER,
  resolution VARCHAR(50),
  refresh_rate INTEGER,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (router_id, output_number)
);

CREATE TABLE router_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  router_id UUID NOT NULL REFERENCES video_routers(id) ON DELETE CASCADE,
  input_id UUID NOT NULL REFERENCES router_inputs(id) ON DELETE CASCADE,
  output_id UUID NOT NULL REFERENCES router_outputs(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE router_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  router_id UUID NOT NULL REFERENCES video_routers(id) ON DELETE CASCADE,
  preset_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE router_preset_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preset_id UUID NOT NULL REFERENCES router_presets(id) ON DELETE CASCADE,
  output_number INTEGER NOT NULL,
  input_number INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   PRODUCTION CONTROL (Master Controller)
============================================================ */
CREATE TABLE production_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scene_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scene_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES production_scenes(id) ON DELETE CASCADE,
  snapshot_name VARCHAR(255) NOT NULL,
  camera_preset_id UUID REFERENCES camera_presets(id) ON DELETE SET NULL,
  dmx_scene_id UUID REFERENCES dmx_scenes(id) ON DELETE SET NULL,
  mixer_scene_id UUID REFERENCES mixer_scenes(id) ON DELETE SET NULL,
  router_preset_id UUID REFERENCES router_presets(id) ON DELETE SET NULL,
  transition_time_ms INTEGER DEFAULT 1000,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   DEVICE CONTROL LOG (Audit Trail)
============================================================ */
CREATE TABLE device_control_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  device_type VARCHAR(50) CHECK (device_type IN ('camera', 'dmx', 'mixer', 'router')),
  device_id UUID,
  action VARCHAR(255) NOT NULL,
  parameters JSONB,
  controlled_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   INDEXES FOR PERFORMANCE
============================================================ */
CREATE INDEX idx_camera_devices_org ON camera_devices(organization_id);
CREATE INDEX idx_camera_devices_online ON camera_devices(is_online);
CREATE INDEX idx_camera_presets_camera ON camera_presets(camera_id);
CREATE INDEX idx_dmx_controllers_org ON dmx_controllers(organization_id);
CREATE INDEX idx_dmx_fixtures_controller ON dmx_fixtures(dmx_controller_id);
CREATE INDEX idx_dmx_scenes_controller ON dmx_scenes(dmx_controller_id);
CREATE INDEX idx_audio_mixers_org ON audio_mixers(organization_id);
CREATE INDEX idx_mixer_channels_mixer ON mixer_channels(mixer_id);
CREATE INDEX idx_mixer_faders_channel ON mixer_faders(channel_id);
CREATE INDEX idx_mixer_scenes_mixer ON mixer_scenes(mixer_id);
CREATE INDEX idx_video_routers_org ON video_routers(organization_id);
CREATE INDEX idx_router_inputs_router ON router_inputs(router_id);
CREATE INDEX idx_router_outputs_router ON router_outputs(router_id);
CREATE INDEX idx_production_scenes_org ON production_scenes(organization_id);
CREATE INDEX idx_device_control_log_org ON device_control_log(organization_id, timestamp DESC);

/* ============================================================
   TEMPLATE MARKETPLACE
============================================================ */
CREATE TABLE presentation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  category VARCHAR(100) CHECK (category IN ('worship', 'sermon', 'announcement', 'event', 'prayer', 'bible_study', 'youth', 'christmas', 'easter', 'other')),
  difficulty VARCHAR(50) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_public BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  price DECIMAL(10, 2) DEFAULT 0,
  license_type VARCHAR(50) CHECK (license_type IN ('free', 'paid', 'premium', 'ccby', 'ccbysa')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE template_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES presentation_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (template_id, user_id)
);

CREATE TABLE template_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES presentation_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   BACKGROUND & MUSIC LIBRARY
============================================================ */
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  library_name VARCHAR(255) NOT NULL,
  description TEXT,
  media_type VARCHAR(50) CHECK (media_type IN ('background', 'music', 'sound_effect', 'video')) DEFAULT 'background',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID NOT NULL REFERENCES media_library(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  duration_seconds INTEGER,
  thumbnail_url VARCHAR(500),
  artist_name VARCHAR(255),
  license_type VARCHAR(50) CHECK (license_type IN ('free', 'ccby', 'ccbysa', 'proprietary')),
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE library_item_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
  used_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   COMMUNITY PRESENTATIONS SHARING
============================================================ */
CREATE TABLE community_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE community_presentation_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES community_presentations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (presentation_id, user_id)
);

CREATE TABLE community_presentation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES community_presentations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (presentation_id, user_id)
);

CREATE TABLE community_presentation_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES community_presentations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   SERMON NOTES DATABASE
============================================================ */
CREATE TABLE sermon_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  book_of_bible VARCHAR(255),
  start_date DATE,
  end_date DATE,
  cover_image_url VARCHAR(500),
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sermon_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_series_id UUID NOT NULL REFERENCES sermon_series(id) ON DELETE CASCADE,
  presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  scripture_reference VARCHAR(255),
  speaker_name VARCHAR(255),
  sermon_date DATE,
  notes_content TEXT,
  outline JSONB,
  key_points JSONB,
  discussion_questions JSONB,
  prayer_requests TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sermon_note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_note_id UUID NOT NULL REFERENCES sermon_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   SERMON SERIES & PLUG-AND-PLAY
============================================================ */
CREATE TABLE sermon_series_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_series_id UUID NOT NULL REFERENCES sermon_series(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  week_number INTEGER,
  presentation_template_id UUID REFERENCES presentation_templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sermon_series_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  preset_name VARCHAR(255) NOT NULL,
  description TEXT,
  sermon_series_id UUID REFERENCES sermon_series(id) ON DELETE SET NULL,
  is_template BOOLEAN DEFAULT false,
  config JSONB,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sermon_series_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  preset_id UUID NOT NULL REFERENCES sermon_series_presets(id) ON DELETE CASCADE,
  deployed_at TIMESTAMP DEFAULT NOW(),
  deployed_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL
);

/* ============================================================
   INDEXES
============================================================ */
CREATE INDEX idx_templates_category ON presentation_templates(category);
CREATE INDEX idx_templates_featured ON presentation_templates(is_featured);
CREATE INDEX idx_templates_public ON presentation_templates(is_public);
CREATE INDEX idx_library_org ON media_library(organization_id);
CREATE INDEX idx_library_items_lib ON library_items(library_id);
CREATE INDEX idx_community_presentations_org ON community_presentations(organization_id);
CREATE INDEX idx_community_presentations_public ON community_presentations(is_public);
CREATE INDEX idx_sermon_series_org ON sermon_series(organization_id);
CREATE INDEX idx_sermon_notes_series ON sermon_notes(sermon_series_id);
CREATE INDEX idx_sermon_series_templates_series ON sermon_series_templates(sermon_series_id);
CREATE INDEX idx_sermon_deployments_org ON sermon_series_deployments(organization_id);

/* ============================================================
   CAPTION & TRANSCRIPTION SYSTEM
============================================================ */
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  transcript_text TEXT,
  language VARCHAR(10) DEFAULT 'en',
  confidence_score DECIMAL(3, 2),
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  start_time INTEGER NOT NULL, -- milliseconds
  end_time INTEGER NOT NULL,
  text TEXT NOT NULL,
  speaker_name VARCHAR(255),
  confidence DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE lyrics_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  detected_lyrics TEXT,
  confidence_score DECIMAL(3, 2),
  source VARCHAR(100), -- 'spotify', 'genius', 'manual'
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE image_recognition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  timestamp INTEGER, -- milliseconds for video
  detected_objects JSONB, -- [{label: "person", confidence: 0.95}, ...]
  detected_text TEXT,
  scene_description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE smart_cuepoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  timestamp INTEGER NOT NULL, -- milliseconds
  cue_type VARCHAR(50) CHECK (cue_type IN ('scene_change', 'speaker_change', 'music_beat', 'silence', 'highlight', 'manual')),
  description TEXT,
  confidence DECIMAL(3, 2),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transcriptions_media ON transcriptions(media_id);
CREATE INDEX idx_transcriptions_status ON transcriptions(status);
CREATE INDEX idx_captions_transcription ON captions(transcription_id);
CREATE INDEX idx_captions_media ON captions(media_id);
CREATE INDEX idx_lyrics_media ON lyrics_suggestions(media_id);
CREATE INDEX idx_image_recognition_media ON image_recognition(media_id);
CREATE INDEX idx_cuepoints_media ON smart_cuepoints(media_id);