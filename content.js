// Main content script - orchestrates all horror effects
import { Settings } from './shared/settings.js';
import { UNSAFE_DOMAINS, MSG, TIME } from './shared/constants.js';
import { isUnsafeDomain, isWhitelisted, isFullscreenOrCall, hasActiveForm, prefersReducedMotion, isNightTime } from './shared/utils.js';
import { HorrorAudio } from './audio.js';
import { GhostManager } from './ghosts.js';
import { SpiderManager } from './spiders.js';
import { CorruptionManager } from './corruption.js';
import { EnvironmentManager } from './environment.js';

class HauntedWeb {
  constructor() {
    this.settings = null;
    this.audio = null;
    this.ghostManager = null;
    this.spiderManager = null;
    this.corruptionManager = null;
    this.environmentManager = null;
    this.intensity = 0.5;
    this.timeOnPage = 0;
    this.intensityTimer = null;
    this.safetyCheckTimer = null;
    this.initialized = false;
    this.enabled = true;
  }

  async init() {
    if (this.initialized) return;

    // Get settings
    this.settings = await this.getSettings();
    
    // Check if should be disabled
    if (this.shouldDisable()) {
      console.log('Haunted Web: Disabled on this site for safety');
      return;
    }

    // Check reduced motion preference
    if (prefersReducedMotion()) {
      console.log('Haunted Web: Respecting reduced motion preference');
      this.settings.intensity = 0.2;
    }

    this.intensity = this.settings.intensity;

    // Initialize systems
    this.audio = new HorrorAudio();
    this.ghostManager = new GhostManager(this.audio, this.settings);
    this.spiderManager = new SpiderManager(this.audio, this.settings);
    this.corruptionManager = new CorruptionManager(this.settings);
    this.environmentManager = new EnvironmentManager(this.settings);

    // Initialize audio on first user interaction
    this.initAudioOnInteraction();

    // Start effects if enabled
    if (this.settings.enabled) {
      this.start();
    }

    // Listen for messages
    this.setupMessageListener();

    // Start intensity scaling
    this.startIntensityScaling();

    // Start safety checks
    this.startSafetyChecks();

    this.initialized = true;
    console.log('Haunted Web: Initialized', this.settings);
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }, (response) => {
        if (response && response.success) {
          resolve(response.settings);
        } else {
          // Use defaults if can't get settings
          resolve({
            enabled: true,
            intensity: 0.5,
            ghostFrequency: 0.3,
            spiderFrequency: 0.2,
            distortionFrequency: 0.4,
            audioVolume: 0.5,
            nightModeAggression: true,
            ghosts: true,
            spiders: true,
            fog: true,
            audio: true,
            glitches: true,
            corruption: true,
            shadows: true,
            blood: true,
            whitelist: [],
            blacklist: []
          });
        }
      });
    });
  }

  shouldDisable() {
    const url = window.location.href;
    
    // Check if in whitelist
    if (this.settings.whitelist && isWhitelisted(url, this.settings.whitelist)) {
      return true;
    }

    // Check if unsafe domain
    if (isUnsafeDomain(url, UNSAFE_DOMAINS)) {
      return true;
    }

    return false;
  }

  initAudioOnInteraction() {
    const initAudio = async () => {
      await this.audio.init();
      if (this.settings.audio && this.settings.enabled) {
        this.audio.setVolume(this.settings.audioVolume);
        this.audio.startDrone();
      }
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
  }

  start() {
    if (!this.enabled) return;

    this.enabled = true;
    
    // Apply night mode if enabled
    const nightBoost = this.settings.nightModeAggression && isNightTime() ? 1.5 : 1;
    
    // Update settings with night boost
    const boostedSettings = {
      ...this.settings,
      ghostFrequency: Math.min(this.settings.ghostFrequency * nightBoost, 1),
      spiderFrequency: Math.min(this.settings.spiderFrequency * nightBoost, 1),
      distortionFrequency: Math.min(this.settings.distortionFrequency * nightBoost, 1)
    };

    this.ghostManager.updateSettings(boostedSettings);
    this.spiderManager.updateSettings(boostedSettings);
    this.corruptionManager.updateSettings(boostedSettings);
    this.environmentManager.updateSettings(boostedSettings);

    // Start all managers
    if (this.settings.ghosts) this.ghostManager.start();
    if (this.settings.spiders) this.spiderManager.start();
    if (this.settings.corruption) this.corruptionManager.start();
    this.environmentManager.start();

    // Start audio
    if (this.audio && this.audio.initialized && this.settings.audio) {
      this.audio.startDrone();
    }
  }

  stop() {
    this.enabled = false;
    
    if (this.ghostManager) this.ghostManager.stop();
    if (this.spiderManager) this.spiderManager.stop();
    if (this.corruptionManager) this.corruptionManager.stop();
    if (this.environmentManager) this.environmentManager.stop();
    if (this.audio) this.audio.stopDrone();
  }

  panic() {
    this.stop();
    this.cleanup();
  }

  cleanup() {
    // Remove all haunted elements
    const elements = document.querySelectorAll('[class^="haunted-"], [class*=" haunted-"]');
    elements.forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    // Reset body styles
    document.body.style.transform = '';
    document.body.style.filter = '';
  }

  startIntensityScaling() {
    this.intensityTimer = setInterval(() => {
      this.timeOnPage += TIME.INTENSITY_SCALE_INTERVAL;
      
      // Gradually increase intensity (cap at 2x original)
      const scale = 1 + Math.min(this.timeOnPage / 300000, 1); // Max at 5 minutes
      this.intensity = this.settings.intensity * scale;
      
      // Update all managers with scaled intensity
      if (this.enabled) {
        const scaledSettings = {
          ...this.settings,
          intensity: this.intensity
        };
        
        if (this.ghostManager) this.ghostManager.updateSettings(scaledSettings);
        if (this.spiderManager) this.spiderManager.updateSettings(scaledSettings);
        if (this.corruptionManager) this.corruptionManager.updateSettings(scaledSettings);
        if (this.environmentManager) this.environmentManager.updateSettings(scaledSettings);
      }
    }, TIME.INTENSITY_SCALE_INTERVAL);
  }

  startSafetyChecks() {
    this.safetyCheckTimer = setInterval(() => {
      // Check for fullscreen or active forms
      if (isFullscreenOrCall() || hasActiveForm()) {
        if (this.enabled) {
          this.stop();
        }
      } else if (!this.enabled && this.settings.enabled) {
        this.start();
      }
    }, 1000);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case MSG.UPDATE_SETTINGS:
          this.settings = { ...this.settings, ...request.settings };
          this.updateFromSettings();
          break;
        
        case MSG.PANIC:
          this.panic();
          break;
        
        case MSG.ENABLE:
          this.settings.enabled = true;
          this.start();
          break;
        
        case MSG.DISABLE:
          this.settings.enabled = false;
          this.stop();
          break;
      }
    });
  }

  updateFromSettings() {
    // Update audio volume
    if (this.audio) {
      this.audio.setVolume(this.settings.audioVolume);
      if (this.settings.audio && !this.audio.droneOscillator) {
        this.audio.startDrone();
      } else if (!this.settings.audio && this.audio.droneOscillator) {
        this.audio.stopDrone();
      }
    }

    // Restart if enabled state changed
    if (this.settings.enabled && !this.enabled) {
      this.start();
    } else if (!this.settings.enabled && this.enabled) {
      this.stop();
    } else if (this.enabled) {
      // Update all managers
      if (this.ghostManager) this.ghostManager.updateSettings(this.settings);
      if (this.spiderManager) this.spiderManager.updateSettings(this.settings);
      if (this.corruptionManager) this.corruptionManager.updateSettings(this.settings);
      if (this.environmentManager) this.environmentManager.updateSettings(this.settings);
    }
  }

  destroy() {
    if (this.intensityTimer) clearInterval(this.intensityTimer);
    if (this.safetyCheckTimer) clearInterval(this.safetyCheckTimer);
    
    this.stop();
    this.cleanup();
    
    if (this.audio) this.audio.destroy();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const hauntedWeb = new HauntedWeb();
    hauntedWeb.init();
  });
} else {
  const hauntedWeb = new HauntedWeb();
  hauntedWeb.init();
}
