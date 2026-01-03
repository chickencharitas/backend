const VmixProvider = require('./vmix');
const ObsProvider = require('./obs');
const NativeStreamingProvider = require('./native');
const CameraProvider = require('./camera');

/**
 * Integration Registry
 * Manages all available providers and their metadata
 */
class IntegrationRegistry {
  constructor() {
    this.providers = new Map();
    this.categories = new Map();
    
    // Register built-in providers
    this._registerBuiltInProviders();
    this._setupCategories();
  }

  /**
   * Register a provider
   */
  register(provider) {
    if (!provider.type || !provider.name || !provider.category) {
      throw new Error('Provider must have type, name, and category');
    }
    
    this.providers.set(provider.type, provider);
  }

  /**
   * Get provider by type
   */
  getProvider(type) {
    return this.providers.get(type);
  }

  /**
   * Get all providers
   */
  getAllProviders() {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by category
   */
  getProvidersByCategory(category) {
    return Array.from(this.providers.values())
      .filter(provider => provider.category === category);
  }

  /**
   * Get all categories with providers
   */
  getCategories() {
    const categories = {};
    
    for (const [category, info] of this.categories) {
      categories[category] = {
        ...info,
        providers: this.getProvidersByCategory(category)
      };
    }
    
    return categories;
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(type) {
    const provider = this.getProvider(type);
    return provider ? provider.getCapabilities() : [];
  }

  /**
   * Execute action on provider
   */
  async executeAction(type, action, params, credentials, user) {
    const provider = this.getProvider(type);
    
    if (!provider) {
      throw new Error(`Unknown provider: ${type}`);
    }
    
    return await provider.execute(action, params, credentials, user);
  }

  /**
   * Test provider connection
   */
  async testConnection(type, credentials) {
    const provider = this.getProvider(type);
    
    if (!provider) {
      throw new Error(`Unknown provider: ${type}`);
    }
    
    return await provider.testConnection(credentials);
  }

  /**
   * Get provider state
   */
  async getState(type, credentials) {
    const provider = this.getProvider(type);
    
    if (!provider) {
      throw new Error(`Unknown provider: ${type}`);
    }
    
    return await provider.getState(credentials);
  }

  /**
   * Validate provider credentials
   */
  validateCredentials(type, credentials) {
    const provider = this.getProvider(type);
    
    if (!provider) {
      return { valid: false, errors: [`Unknown provider: ${type}`] };
    }
    
    return provider.validateCredentials(credentials);
  }

  /**
   * Register built-in providers
   */
  _registerBuiltInProviders() {
    // Register native streaming (your core platform)
    this.register(new NativeStreamingProvider());
    
    // Register camera control
    this.register(new CameraProvider());
    
    // Register OBS (optional for professional users)
    this.register(new ObsProvider());
    
    // Register vMix (optional for professional users)
    this.register(new VmixProvider());
  }

  /**
   * Setup categories with metadata
   */
  _setupCategories() {
    this.categories.set('video_switcher', {
      name: 'Video Switchers',
      description: 'Hardware and software video mixers/switchers',
      icon: 'switch_video',
      priority: 1
    });

    this.categories.set('camera', {
      name: 'Cameras',
      description: 'PTZ and professional cameras',
      icon: 'videocam',
      priority: 2
    });

    this.categories.set('audio_mixer', {
      name: 'Audio Mixers',
      description: 'Digital and analog audio mixing consoles',
      icon: 'speaker',
      priority: 3
    });

    this.categories.set('lighting', {
      name: 'Lighting',
      description: 'DMX lighting controllers and smart lighting',
      icon: 'lightbulb',
      priority: 4
    });

    this.categories.set('streaming', {
      name: 'Streaming & Recording',
      description: 'Streaming platforms and recording systems',
      icon: 'live_tv',
      priority: 5
    });

    this.categories.set('control', {
      name: 'Control Surfaces',
      description: 'Hardware controllers and control surfaces',
      icon: 'tune',
      priority: 6
    });
  }
}

// Create singleton instance
const registry = new IntegrationRegistry();

module.exports = registry;
