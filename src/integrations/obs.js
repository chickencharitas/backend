const { EventEmitter } = require('events');
const WebSocket = require('ws');
const BaseProvider = require('./base');

/**
 * OBS Provider - WebSocket Integration
 * Supports OBS Studio with obs-websocket v5+
 */
class ObsProvider extends BaseProvider {
  constructor() {
    super('obs', 'OBS Studio', 'video_switcher');
    
    // Add OBS capabilities
    this.capabilities.add('scene_change');
    this.capabilities.add('transition');
    this.capabilities.add('cut');
    this.capabilities.add('fade');
    this.capabilities.add('source_toggle');
    this.capabilities.add('audio_mute');
    this.capabilities.add('recording');
    this.capabilities.add('streaming');
    this.capabilities.add('screenshot');
    this.capabilities.add('text_source');
    
    // WebSocket connection pool
    this.connections = new Map(); // orgId -> WebSocket
  }

  /**
   * Test connection to OBS
   */
  async testConnection(credentials) {
    try {
      const { host, port = 4455, password } = credentials;
      
      if (!host) {
        return { success: false, error: 'Host is required' };
      }

      // Create temporary connection for testing
      const ws = new WebSocket(`ws://${host}:${port}`);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          ws.terminate();
          resolve({ success: false, error: 'Connection timeout' });
        }, 5000);

        ws.on('open', () => {
          // Send Identify message if password is provided
          if (password) {
            ws.send(JSON.stringify({
              'request-type': 'Identify',
              'rpcVersion': 1,
              'authentication': password
            }));
          } else {
            ws.send(JSON.stringify({
              'request-type': 'Identify',
              'rpcVersion': 1
            }));
          }
        });

        ws.on('message', (data) => {
          try {
            const response = JSON.parse(data.toString());
            
            if (response['request-type'] === 'Identify' && response['status'] === 'ok') {
              clearTimeout(timeout);
              ws.close();
              resolve({
                success: true,
                info: {
                  obsVersion: response['obs-version'],
                  obsWebSocketVersion: response['obs-websocket-version'],
                  rpcVersion: response['rpcVersion']
                }
              });
            } else if (response['error'] === 'Authentication failed') {
              clearTimeout(timeout);
              ws.close();
              resolve({ success: false, error: 'Authentication failed' });
            }
          } catch (err) {
            clearTimeout(timeout);
            ws.close();
            resolve({ success: false, error: 'Invalid response format' });
          }
        });

        ws.on('error', () => {
          clearTimeout(timeout);
          resolve({ success: false, error: 'Cannot connect to OBS WebSocket' });
        });
      });

    } catch (error) {
      return {
        success: false,
        error: `OBS connection test failed: ${error.message}`
      };
    }
  }

  /**
   * Execute OBS command
   */
  async execute(action, params, credentials, user) {
    try {
      const { host, port = 4455, password } = credentials;
      const orgId = user.organizationId;
      
      if (!host) {
        return { success: false, error: 'OBS host not configured' };
      }

      let permission = this.getRequiredPermission(action);
      
      // Check permissions (simplified - in real app, check user role)
      if (permission === 'admin' && user.role !== 'admin') {
        return { success: false, error: 'Admin permission required' };
      }

      // Get or create WebSocket connection
      const ws = await this._getConnection(orgId, host, port, password);
      
      // Build OBS request based on action
      let request;
      
      switch (action) {
        case 'scene_change':
          request = {
            'request-type': 'SetCurrentScene',
            'scene-name': params.scene
          };
          break;
          
        case 'cut':
          request = {
            'request-type': 'SetTransition',
            'transition-name': 'Cut'
          };
          // Execute the transition
          setTimeout(() => {
            ws.send(JSON.stringify({
              'request-type': 'TriggerTransition'
            }));
          }, 100);
          break;
          
        case 'fade':
          request = {
            'request-type': 'SetTransition',
            'transition-name': params.transitionName || 'Fade'
          };
          // Execute the transition
          setTimeout(() => {
            ws.send(JSON.stringify({
              'request-type': 'TriggerTransition'
            }));
          }, 100);
          break;
          
        case 'source_toggle':
          request = {
            'request-type': 'SetSceneItemProperties',
            'scene-name': params.scene || 'Scene',
            'item': params.source,
            'visible': !params.visible // Toggle current state
          };
          break;
          
        case 'audio_mute':
          request = {
            'request-type': 'SetMute',
            'source': params.source,
            'mute': params.mute
          };
          break;
          
        case 'recording_start':
          request = {
            'request-type': 'StartRecording'
          };
          permission = 'admin';
          break;
          
        case 'recording_stop':
          request = {
            'request-type': 'StopRecording'
          };
          permission = 'admin';
          break;
          
        case 'streaming_start':
          request = {
            'request-type': 'StartStreaming'
          };
          permission = 'admin';
          break;
          
        case 'streaming_stop':
          request = {
            'request-type': 'StopStreaming'
          };
          permission = 'admin';
          break;
          
        case 'screenshot':
          request = {
            'request-type': 'TakeSourceScreenshot',
            'source': params.source,
            'embedPictureFormat': 'png'
          };
          break;
          
        case 'text_source':
          request = {
            'request-type': 'SetTextFreetype2Properties',
            'source': params.source,
            'text': params.text
          };
          break;
          
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }

      // Send request and wait for response
      const result = await this._sendRequest(ws, request);
      
      return {
        success: true,
        result
      };

    } catch (error) {
      return {
        success: false,
        error: `OBS command failed: ${error.message}`
      };
    }
  }

  /**
   * Get current OBS state
   */
  async getState(credentials) {
    try {
      const { host, port = 4455, password } = credentials;
      
      const ws = await this._getConnection('temp', host, port, password);
      
      // Get current scene
      const sceneResponse = await this._sendRequest(ws, {
        'request-type': 'GetCurrentScene'
      });
      
      // Get scene list
      const scenesResponse = await this._sendRequest(ws, {
        'request-type': 'GetSceneList'
      });
      
      // Get recording and streaming status
      const statusResponse = await this._sendRequest(ws, {
        'request-type': 'GetStreamingStatus'
      });
      
      const state = {
        currentScene: sceneResponse['name'],
        scenes: scenesResponse['scenes'] || [],
        recording: statusResponse['recording'],
        streaming: statusResponse['streaming']
      };

      // Clean up temp connection
      if (this.connections.has('temp')) {
        this.connections.get('temp').close();
        this.connections.delete('temp');
      }

      return state;
    } catch (error) {
      throw new Error(`Failed to get OBS state: ${error.message}`);
    }
  }

  /**
   * Validate OBS credentials
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
   * Get or create WebSocket connection
   */
  async _getConnection(orgId, host, port, password) {
    if (this.connections.has(orgId)) {
      const ws = this.connections.get(orgId);
      if (ws.readyState === WebSocket.OPEN) {
        return ws;
      } else {
        // Remove dead connection
        this.connections.delete(orgId);
      }
    }

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://${host}:${port}`);
      
      ws.on('open', () => {
        // Send Identify message
        const identifyMsg = {
          'request-type': 'Identify',
          'rpcVersion': 1
        };
        
        if (password) {
          identifyMsg['authentication'] = password;
        }
        
        ws.send(JSON.stringify(identifyMsg));
      });

      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          
          if (response['request-type'] === 'Identify' && response['status'] === 'ok') {
            this.connections.set(orgId, ws);
            resolve(ws);
          } else if (response['error']) {
            reject(new Error(response['error']));
          }
        } catch (err) {
          reject(new Error('Invalid response format'));
        }
      });

      ws.on('error', (error) => {
        reject(new Error(`WebSocket connection failed: ${error.message}`));
      });
    });
  }

  /**
   * Send request and wait for response
   */
  async _sendRequest(ws, request) {
    return new Promise((resolve, reject) => {
      const messageId = Date.now().toString();
      request['message-id'] = messageId;
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 3000);

      const messageHandler = (data) => {
        try {
          const response = JSON.parse(data.toString());
          if (response['message-id'] === messageId) {
            clearTimeout(timeout);
            ws.removeListener('message', messageHandler);
            
            if (response['status'] === 'ok') {
              resolve(response);
            } else {
              reject(new Error(response['error'] || 'Request failed'));
            }
          }
        } catch (err) {
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);
          reject(new Error('Invalid response format'));
        }
      };

      ws.on('message', messageHandler);
      ws.send(JSON.stringify(request));
    });
  }

  /**
   * Close all connections
   */
  closeAllConnections() {
    for (const [orgId, ws] of this.connections) {
      ws.close();
    }
    this.connections.clear();
  }
}

module.exports = ObsProvider;
