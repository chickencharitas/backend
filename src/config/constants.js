const USER_ROLES = {
  ADMIN: 'admin',
  PASTOR: 'pastor',
  WORSHIP_LEADER: 'worship_leader',
  AV_TECH: 'av_tech',
  VOLUNTEER: 'volunteer'
};

const PERMISSIONS = {
  // Admin
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_REPORTS: 'view_reports',
  
  // Worship Leader / Pastor
  CREATE_PRESENTATION: 'create_presentation',
  EDIT_PRESENTATION: 'edit_presentation',
  DELETE_PRESENTATION: 'delete_presentation',
  CREATE_PLAYLIST: 'create_playlist',
  EDIT_PLAYLIST: 'edit_playlist',
  DELETE_PLAYLIST: 'delete_playlist',
  
  // AV Tech
  CONTROL_DISPLAY: 'control_display',
  MANAGE_OUTPUTS: 'manage_outputs',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  
  // Everyone
  VIEW_MEDIA: 'view_media',
  VIEW_SCRIPTURE: 'view_scripture'
};

const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES. PASTOR]: [
    PERMISSIONS.CREATE_PRESENTATION,
    PERMISSIONS. EDIT_PRESENTATION,
    PERMISSIONS.DELETE_PRESENTATION,
    PERMISSIONS.CREATE_PLAYLIST,
    PERMISSIONS.EDIT_PLAYLIST,
    PERMISSIONS.DELETE_PLAYLIST,
    PERMISSIONS.VIEW_MEDIA,
    PERMISSIONS.VIEW_SCRIPTURE,
    PERMISSIONS.VIEW_REPORTS
  ],
  [USER_ROLES.WORSHIP_LEADER]: [
    PERMISSIONS.CREATE_PRESENTATION,
    PERMISSIONS.EDIT_PRESENTATION,
    PERMISSIONS.DELETE_PRESENTATION,
    PERMISSIONS.CREATE_PLAYLIST,
    PERMISSIONS.EDIT_PLAYLIST,
    PERMISSIONS.DELETE_PLAYLIST,
    PERMISSIONS. VIEW_MEDIA,
    PERMISSIONS.VIEW_SCRIPTURE
  ],
  [USER_ROLES.AV_TECH]: [
    PERMISSIONS.CONTROL_DISPLAY,
    PERMISSIONS.MANAGE_OUTPUTS,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.VIEW_MEDIA,
    PERMISSIONS.VIEW_SCRIPTURE
  ],
  [USER_ROLES.VOLUNTEER]: [
    PERMISSIONS.VIEW_MEDIA,
    PERMISSIONS.VIEW_SCRIPTURE
  ]
};

const MEDIA_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  DOCUMENT: 'document'
};

const PRESENTATION_TYPES = {
  SERMON: 'sermon',
  SONG_LYRICS: 'song_lyrics',
  SCRIPTURE: 'scripture',
  ANNOUNCEMENT: 'announcement',
  CUSTOM: 'custom'
};

const PLAYLIST_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

const OUTPUT_TYPES = {
  MAIN_DISPLAY: 'main_display',
  STAGE_MONITOR: 'stage_monitor',
  LIVESTREAM: 'livestream',
  RECORDING: 'recording'
};

const INTEGRATION_TYPES = {
  OBS: 'obs',
  VMIX: 'vmix',
  STREAM_DECK: 'stream_deck',
  MIDI: 'midi',
  NDI: 'ndi',
  CCLI: 'ccli'
};

const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise'
};

const TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.FREE]: {
    maxUsers: 3,
    maxPlaylists: 5,
    maxMediaStorage: 1024 * 1024 * 500, // 500MB
    outputs: 1,
    integrations: [],
    liveStream: false
  },
  [SUBSCRIPTION_TIERS.BASIC]: {
    maxUsers: 10,
    maxPlaylists: 50,
    maxMediaStorage: 1024 * 1024 * 5000, // 5GB
    outputs: 3,
    integrations: ['obs', 'midi'],
    liveStream: true,
    multiScreen: true
  },
  [SUBSCRIPTION_TIERS. PROFESSIONAL]: {
    maxUsers: 50,
    maxPlaylists: 500,
    maxMediaStorage: 1024 * 1024 * 50000, // 50GB
    outputs: 8,
    integrations: ['obs', 'vmix', 'stream_deck', 'midi', 'ndi', 'ccli'],
    liveStream: true,
    multiScreen: true,
    advancedAnalytics: true,
    customBranding: true
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    maxUsers: -1,
    maxPlaylists: -1,
    maxMediaStorage: -1,
    outputs: -1,
    integrations: ['obs', 'vmix', 'stream_deck', 'midi', 'ndi', 'ccli'],
    liveStream: true,
    multiScreen: true,
    advancedAnalytics: true,
    customBranding: true,
    dedicatedSupport: true,
    customIntegrations: true
  }
};

module.exports = {
  USER_ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  MEDIA_TYPES,
  PRESENTATION_TYPES,
  PLAYLIST_STATUS,
  OUTPUT_TYPES,
  INTEGRATION_TYPES,
  SUBSCRIPTION_TIERS,
  TIER_FEATURES
};