/**
 * Base Provider Interface
 * All AV integration providers must implement this interface
 */
class BaseProvider {
  constructor(type, name, category) {
    this.type = type; // e.g., 'vmix', 'obs', 'atem'
    this.name = name; // e.g., 'vMix', 'OBS Studio', 'ATEM Mini'
    this.category = category; // e.g., 'video_switcher', 'camera', 'audio_mixer', 'lighting'
    this.capabilities = new Set();
  }

  /**
   * Test connection to the device
   * @param {Object} credentials - Connection parameters (host, port, password, etc.)
   * @returns {Promise<{success: boolean, error?: string, info?: Object}>}
   */
  async testConnection(credentials) {
    throw new Error('testConnection must be implemented by provider');
  }

  /**
   * Get provider capabilities
   * @returns {Array<string>} - Array of capability identifiers
   */
  getCapabilities() {
    return Array.from(this.capabilities);
  }

  /**
   * Execute a command on the device
   * @param {string} action - Action identifier
   * @param {Object} params - Action parameters
   * @param {Object} credentials - Connection credentials
   * @param {Object} user - User context for permissions
   * @returns {Promise<{success: boolean, result?: any, error?: string}>}
   */
  async execute(action, params, credentials, user) {
    throw new Error('execute must be implemented by provider');
  }

  /**
   * Get current device state
   * @param {Object} credentials - Connection credentials
   * @returns {Promise<Object>} - Current state
   */
  async getState(credentials) {
    throw new Error('getState must be implemented by provider');
  }

  /**
   * Validate credentials format
   * @param {Object} credentials - Credentials to validate
   * @returns {Object} - {valid: boolean, errors: string[]}
   */
  validateCredentials(credentials) {
    throw new Error('validateCredentials must be implemented by provider');
  }

  /**
   * Get required permission for an action
   * @param {string} action - Action identifier
   * @returns {string} - Permission required
   */
  getRequiredPermission(action) {
    // Default to operator level, providers can override
    const permissionMap = {
      // Admin-only actions
      'stream_start': 'admin',
      'stream_stop': 'admin',
      'record_start': 'admin',
      'record_stop': 'admin',
      'settings_change': 'admin',
      
      // Director-level actions
      'scene_change': 'director',
      'mix_change': 'director',
      'transition_change': 'director',
      
      // Operator-level actions (default)
      'cut': 'operator',
      'fade': 'operator',
      'overlay_toggle': 'operator',
      'audio_mute': 'operator',
      'camera_preset': 'operator'
    };
    
    return permissionMap[action] || 'operator';
  }
}

module.exports = BaseProvider;
