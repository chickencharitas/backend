-- ProPresenter-like features migration
-- Adds live presentation control, cues, transitions, and dual display support

/* ============================================================
   LIVE PRESENTATIONS (Real-time presentation control)
============================================================ */
CREATE TABLE live_presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  current_slide_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  stage_display_mode VARCHAR(50) DEFAULT 'lyrics', -- lyrics, notes, chords, blank
  audience_display_mode VARCHAR(50) DEFAULT 'full', -- full, blank, logo
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   SLIDE FORMATTING (Rich text and styling)
============================================================ */
CREATE TABLE slide_formatting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES presentation_slides(id) ON DELETE CASCADE,
  content_type VARCHAR(50) DEFAULT 'text', -- text, scripture, chorus, verse
  text_content TEXT,
  font_family VARCHAR(100) DEFAULT 'Arial',
  font_size INTEGER DEFAULT 48,
  font_color VARCHAR(7) DEFAULT '#FFFFFF',
  font_weight VARCHAR(20) DEFAULT 'normal',
  text_align VARCHAR(20) DEFAULT 'center',
  background_color VARCHAR(7) DEFAULT '#000000',
  background_opacity DECIMAL(3,2) DEFAULT 0.0,
  shadow_color VARCHAR(7),
  shadow_blur INTEGER DEFAULT 0,
  shadow_offset_x INTEGER DEFAULT 0,
  shadow_offset_y INTEGER DEFAULT 0,
  line_height DECIMAL(3,2) DEFAULT 1.2,
  letter_spacing DECIMAL(3,2) DEFAULT 0.0,
  text_transform VARCHAR(20), -- uppercase, lowercase, capitalize
  border_width INTEGER DEFAULT 0,
  border_color VARCHAR(7),
  border_radius INTEGER DEFAULT 0,
  padding_top INTEGER DEFAULT 20,
  padding_right INTEGER DEFAULT 20,
  padding_bottom INTEGER DEFAULT 20,
  padding_left INTEGER DEFAULT 20,
  margin_top INTEGER DEFAULT 0,
  margin_right INTEGER DEFAULT 0,
  margin_bottom INTEGER DEFAULT 0,
  margin_left INTEGER DEFAULT 0,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  z_index INTEGER DEFAULT 0,
  animation_in VARCHAR(50), -- fade, slide, zoom, etc.
  animation_out VARCHAR(50),
  animation_duration INTEGER DEFAULT 500, -- milliseconds
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   SLIDE ELEMENTS (Multiple text boxes, images, etc.)
============================================================ */
CREATE TABLE slide_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES presentation_slides(id) ON DELETE CASCADE,
  element_type VARCHAR(50) NOT NULL, -- text, image, video, shape
  element_order INTEGER NOT NULL,
  content TEXT,
  media_id UUID REFERENCES media(id),
  formatting JSONB, -- Complete formatting object
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  z_index INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   PRESENTATION CUES (Hotkeys and triggers)
============================================================ */
CREATE TABLE presentation_cues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  slide_index INTEGER NOT NULL,
  cue_name VARCHAR(255),
  hotkey VARCHAR(50), -- e.g., "F1", "Ctrl+1", "Space"
  action VARCHAR(50) DEFAULT 'goto_slide', -- goto_slide, next_slide, prev_slide, clear, logo
  target_slide_index INTEGER,
  transition_type VARCHAR(50) DEFAULT 'fade', -- fade, slide_left, slide_right, zoom, cut
  transition_duration INTEGER DEFAULT 500,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   PRESENTATION TRANSITIONS (Global and per-slide)
============================================================ */
CREATE TABLE presentation_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  slide_id UUID REFERENCES presentation_slides(id) ON DELETE CASCADE,
  transition_type VARCHAR(50) DEFAULT 'fade',
  duration INTEGER DEFAULT 500,
  direction VARCHAR(50), -- left, right, up, down
  easing VARCHAR(50) DEFAULT 'ease-in-out',
  delay INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT transition_scope CHECK (
    (presentation_id IS NOT NULL AND slide_id IS NULL) OR
    (presentation_id IS NULL AND slide_id IS NOT NULL)
  )
);

/* ============================================================
   DISPLAY PROFILES (Audience vs Stage configurations)
============================================================ */
CREATE TABLE display_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  profile_name VARCHAR(255) NOT NULL,
  display_type VARCHAR(50) NOT NULL, -- audience, stage_monitor, confidence_monitor
  resolution_width INTEGER DEFAULT 1920,
  resolution_height INTEGER DEFAULT 1080,
  background_color VARCHAR(7) DEFAULT '#000000',
  safe_zone_enabled BOOLEAN DEFAULT true,
  safe_zone_percentage DECIMAL(3,2) DEFAULT 0.9,
  font_scaling DECIMAL(3,2) DEFAULT 1.0,
  show_slide_numbers BOOLEAN DEFAULT false,
  show_clock BOOLEAN DEFAULT false,
  show_logo BOOLEAN DEFAULT true,
  logo_position VARCHAR(20) DEFAULT 'bottom_right',
  logo_opacity DECIMAL(3,2) DEFAULT 0.8,
  watermark_enabled BOOLEAN DEFAULT false,
  watermark_text VARCHAR(255),
  watermark_font VARCHAR(100) DEFAULT 'Arial',
  watermark_size INTEGER DEFAULT 12,
  watermark_color VARCHAR(7) DEFAULT '#FFFFFF',
  watermark_opacity DECIMAL(3,2) DEFAULT 0.5,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   LIVE CONTROL SESSIONS (Multiple controllers)
============================================================ */
CREATE TABLE live_control_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_presentation_id UUID NOT NULL REFERENCES live_presentations(id) ON DELETE CASCADE,
  controller_id VARCHAR(255) NOT NULL, -- unique identifier for each controller device
  controller_name VARCHAR(255),
  user_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP DEFAULT NOW(),
  permissions JSONB DEFAULT '{"next": true, "previous": true, "goto": true, "clear": true}', -- granular permissions
  created_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   PRESENTATION HISTORY (Audit trail for live control)
============================================================ */
CREATE TABLE presentation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_presentation_id UUID NOT NULL REFERENCES live_presentations(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- goto_slide, next_slide, prev_slide, clear_display, etc.
  slide_index INTEGER,
  controller_id VARCHAR(255),
  user_id UUID REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

/* ============================================================
   SLIDE NOTES (For stage monitor display)
============================================================ */
CREATE TABLE slide_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES presentation_slides(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'stage_notes', -- stage_notes, confidence_monitor, tech_notes
  content TEXT,
  visible_on_stage BOOLEAN DEFAULT true,
  font_size INTEGER DEFAULT 24,
  font_color VARCHAR(7) DEFAULT '#FFFFFF',
  background_color VARCHAR(7) DEFAULT '#333333',
  position VARCHAR(20) DEFAULT 'bottom', -- top, bottom, left, right, overlay
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

/* ============================================================
   MEDIA BACKGROUNDS (For slides)
============================================================ */
CREATE TABLE slide_backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID REFERENCES presentation_slides(id) ON DELETE CASCADE,
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id),
  background_type VARCHAR(50) DEFAULT 'image', -- image, video, color, gradient
  background_value VARCHAR(500), -- URL, color code, or gradient definition
  opacity DECIMAL(3,2) DEFAULT 1.0,
  blur_amount INTEGER DEFAULT 0,
  scale_type VARCHAR(20) DEFAULT 'cover', -- cover, contain, stretch, repeat
  position_x DECIMAL(5,2) DEFAULT 50.0, -- percentage
  position_y DECIMAL(5,2) DEFAULT 50.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT background_scope CHECK (
    (slide_id IS NOT NULL AND presentation_id IS NULL) OR
    (slide_id IS NULL AND presentation_id IS NOT NULL)
  )
);

/* ============================================================
   INDEXES
============================================================ */
CREATE INDEX idx_live_presentations_presentation ON live_presentations(presentation_id);
CREATE INDEX idx_live_presentations_active ON live_presentations(is_active);
CREATE INDEX idx_slide_formatting_slide ON slide_formatting(slide_id);
CREATE INDEX idx_slide_elements_slide ON slide_elements(slide_id);
CREATE INDEX idx_presentation_cues_presentation ON presentation_cues(presentation_id);
CREATE INDEX idx_presentation_transitions_presentation ON presentation_transitions(presentation_id);
CREATE INDEX idx_presentation_transitions_slide ON presentation_transitions(slide_id);
CREATE INDEX idx_display_profiles_org ON display_profiles(organization_id);
CREATE INDEX idx_live_control_sessions_live ON live_control_sessions(live_presentation_id);
CREATE INDEX idx_presentation_history_live ON presentation_history(live_presentation_id);
CREATE INDEX idx_slide_notes_slide ON slide_notes(slide_id);
CREATE INDEX idx_slide_backgrounds_slide ON slide_backgrounds(slide_id);
CREATE INDEX idx_slide_backgrounds_presentation ON slide_backgrounds(presentation_id);

/* ============================================================
   DEFAULT DISPLAY PROFILES
   Note: These will be created dynamically when organizations are set up
============================================================ */