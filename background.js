// Background service worker

// Constants
const MSG = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  PANIC: 'PANIC',
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE'
};

const DEFAULTS = {
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
};

// Settings management
class Settings {
  static async get() {
    try {
      const result = await chrome.storage.sync.get(DEFAULTS);
      return result;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULTS;
    }
  }

  static async set(settings) {
    try {
      await chrome.storage.sync.set(settings);
      return true;
    } catch (error) {
      console.error('Error setting settings:', error);
      return false;
    }
  }

  static async update(updates) {
    const current = await this.get();
    const newSettings = { ...current, ...updates };
    return await this.set(newSettings);
  }

  static async reset() {
    return await this.set(DEFAULTS);
  }
}

// Handle installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Haunted Web installed!');
    await Settings.reset();
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.type) {
        case MSG.GET_SETTINGS:
          const settings = await Settings.get();
          sendResponse({ success: true, settings });
          break;
        
        case MSG.UPDATE_SETTINGS:
          await Settings.update(request.settings);
          // Notify all tabs of settings change
          const tabs = await chrome.tabs.query({});
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              type: MSG.UPDATE_SETTINGS,
              settings: request.settings
            }).catch(() => {}); // Ignore errors for tabs without content script
          });
          sendResponse({ success: true });
          break;
        
        case MSG.PANIC:
          await Settings.update({ enabled: false });
          // Notify all tabs to disable
          const allTabs = await chrome.tabs.query({});
          allTabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              type: MSG.PANIC
            }).catch(() => {});
          });
          sendResponse({ success: true });
          break;
        
        case MSG.ENABLE:
          await Settings.update({ enabled: true });
          sendResponse({ success: true });
          break;
        
        case MSG.DISABLE:
          await Settings.update({ enabled: false });
          sendResponse({ success: true });
          break;
        
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Background error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep channel open for async response
});

// Listen for tab updates to check URL safety
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Could implement URL checking here if needed
  }
});
