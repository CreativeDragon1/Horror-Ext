import { DEFAULTS } from './constants.js';

export class Settings {
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
