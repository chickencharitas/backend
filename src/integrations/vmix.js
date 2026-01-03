const axios = require('axios');
const BaseProvider = require('./base');

/**
 * vMix Provider - HTTP API Integration
 * Supports vMix 26+ with HTTP API
 */
class VmixProvider extends BaseProvider {
  constructor() {
    super('vmix', 'vMix', 'video_switcher');
    
    // Add vMix capabilities
    this.capabilities.add('program_select');
    this.capabilities.add('preview_select');
    this.capabilities.add('cut');
    this.capabilities.add('fade');
    this.capabilities.add('fade_to_black');
    this.capabilities.add('overlay_toggle');
    this.capabilities.add('input_settings');
    this.capabilities.add('audio_mute');
    this.capabilities.add('recording');
    this.capabilities.add('streaming');
    this.capabilities.add('external');
  }

  /**
   * Test connection to vMix
   */
  async testConnection(credentials) {
    try {
      const { host, port = 8088 } = credentials;
      
      if (!host) {
        return { success: false, error: 'Host is required' };
      }

      const response = await axios.get(`http://${host}:${port}/api`, {
        timeout: 5000
      });

      if (response.status === 200) {
        const xmlData = response.data;
        const versionMatch = xmlData.match(/version="([^"]+)"/);
        const version = versionMatch ? versionMatch[1] : 'Unknown';
        
        return {
          success: true,
          info: {
            version,
            apiAvailable: true
          }
        };
      }

      return { success: false, error: 'Invalid response from vMix' };
    } catch (error) {
      return {
        success: false,
        error: `Cannot connect to vMix: ${error.message}`
      };
    }
  }

  /**
   * Execute vMix command
   */
  async execute(action, params, credentials, user) {
    try {
      const { host, port = 8088 } = credentials;
      
      if (!host) {
        return { success: false, error: 'vMix host not configured' };
      }

      let command;
      let permission = this.getRequiredPermission(action);

      // Build vMix API command based on action
      switch (action) {
        case 'program_select':
          command = `Program=${params.input}`;
          break;
          
        case 'preview_select':
          command = `Preview=${params.input}`;
          break;
          
        case 'cut':
          command = 'Cut';
          break;
          
        case 'fade':
          command = 'Fade';
          break;
          
        case 'fade_to_black':
          command = 'FadeToBlack';
          break;
          
        case 'overlay_toggle':
          const overlayNum = params.overlay || 1;
          command = `Overlay${overlayNum}Input=${params.input || ''}`;
          break;
          
        case 'audio_mute':
          command = `${params.input ? `Input${params.input}-` : ''}AudioMute=${params.mute ? 'On' : 'Off'}`;
          break;
          
        case 'recording_start':
          command = 'StartRecording';
          permission = 'admin';
          break;
          
        case 'recording_stop':
          command = 'StopRecording';
          permission = 'admin';
          break;
          
        case 'streaming_start':
          command = 'StartStreaming';
          permission = 'admin';
          break;
          
        case 'streaming_stop':
          command = 'StopStreaming';
          permission = 'admin';
          break;
          
        case 'external':
          command = `External=${params.function}`;
          break;
          
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }

      // Check permissions (simplified - in real app, check user role)
      if (permission === 'admin' && user.role !== 'admin') {
        return { success: false, error: 'Admin permission required' };
      }

      // Send command to vMix
      const response = await axios.get(
        `http://${host}:${port}/api/?command=${encodeURIComponent(command)}`,
        { timeout: 3000 }
      );

      return {
        success: true,
        result: {
          command,
          response: response.data
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `vMix command failed: ${error.message}`
      };
    }
  }

  /**
   * Get current vMix state
   */
  async getState(credentials) {
    try {
      const { host, port = 8088 } = credentials;
      
      const response = await axios.get(`http://${host}:${port}/api`, {
        timeout: 5000
      });

      // Parse XML response (simplified - in production, use proper XML parser)
      const xmlData = response.data;
      const state = {
        program: this._extractXmlValue(xmlData, 'program'),
        preview: this._extractXmlValue(xmlData, 'preview'),
        recording: xmlData.includes('<recording>True</recording>'),
        streaming: xmlData.includes('<streaming>True</streaming>'),
        inputs: []
      };

      // Extract inputs info
      const inputMatches = xmlData.matchAll(/<input[^>]*key="([^"]*)"[^>]*title="([^"]*)"[^>]*type="([^"]*)"[^>]*>/g);
      for (const match of inputMatches) {
        state.inputs.push({
          key: match[1],
          title: match[2],
          type: match[3]
        });
      }

      return state;
    } catch (error) {
      throw new Error(`Failed to get vMix state: ${error.message}`);
    }
  }

  /**
   * Validate vMix credentials
   */
  validateCredentials(credentials) {
    const errors = [];
    
    if (!credentials.host) {
      errors.push('Host is required');
    }
    
    if (credentials.port && (isNaN(credentials.port) || credentials.port < 1 || credentials.port > 65535)) {
      errors.push('Port must be a valid port number (1-65535)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper to extract value from vMix XML
   */
  _extractXmlValue(xml, key) {
    const match = xml.match(new RegExp(`<${key}>([^<]+)</${key}>`));
    return match ? match[1] : null;
  }
}

module.exports = VmixProvider;
