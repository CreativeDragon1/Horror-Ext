// Popup control panel JavaScript

// Constants
const MSG = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  PANIC: 'PANIC',
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE'
};

class PopupController {
  constructor() {
    this.settings = null;
    this.init();
  }

  async init() {
    // Load current settings
    await this.loadSettings();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Render UI
    this.render();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }, (response) => {
        if (response && response.success) {
          this.settings = response.settings;
        }
        resolve();
      });
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: MSG.UPDATE_SETTINGS,
        settings: this.settings
      }, (response) => {
        resolve(response && response.success);
      });
    });
  }

  setupEventListeners() {
    // Panic button
    document.getElementById('panicBtn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: MSG.PANIC });
      this.settings.enabled = false;
      this.render();
      this.showNotification('ALL EFFECTS DISABLED!');
    });

    // Master toggle
    document.getElementById('masterToggle').addEventListener('change', async (e) => {
      this.settings.enabled = e.target.checked;
      await this.saveSettings();
      this.showNotification(e.target.checked ? 'Extension Enabled' : 'Extension Disabled');
    });

    // Feature toggles
    const toggles = [
      { id: 'ghostsToggle', key: 'ghosts' },
      { id: 'spidersToggle', key: 'spiders' },
      { id: 'fogToggle', key: 'fog' },
      { id: 'glitchesToggle', key: 'glitches' },
      { id: 'corruptionToggle', key: 'corruption' },
      { id: 'shadowsToggle', key: 'shadows' },
      { id: 'bloodToggle', key: 'blood' },
      { id: 'audioToggle', key: 'audio' },
      { id: 'nightModeToggle', key: 'nightModeAggression' }
    ];

    toggles.forEach(({ id, key }) => {
      document.getElementById(id).addEventListener('change', async (e) => {
        this.settings[key] = e.target.checked;
        await this.saveSettings();
      });
    });

    // Sliders
    const sliders = [
      { id: 'intensitySlider', valueId: 'intensityValue', key: 'intensity' },
      { id: 'ghostFreqSlider', valueId: 'ghostFreqValue', key: 'ghostFrequency' },
      { id: 'spiderFreqSlider', valueId: 'spiderFreqValue', key: 'spiderFrequency' },
      { id: 'distortionFreqSlider', valueId: 'distortionFreqValue', key: 'distortionFrequency' },
      { id: 'audioVolumeSlider', valueId: 'audioVolumeValue', key: 'audioVolume' }
    ];

    sliders.forEach(({ id, valueId, key }) => {
      const slider = document.getElementById(id);
      const valueDisplay = document.getElementById(valueId);
      
      slider.addEventListener('input', (e) => {
        const value = e.target.value / 100;
        valueDisplay.textContent = e.target.value + '%';
        this.settings[key] = value;
      });

      slider.addEventListener('change', async () => {
        await this.saveSettings();
      });
    });

    // Whitelist
    document.getElementById('addWhitelistBtn').addEventListener('click', () => {
      this.addToWhitelist();
    });

    document.getElementById('whitelistInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addToWhitelist();
      }
    });
  }

  render() {
    if (!this.settings) return;

    // Set toggle states
    document.getElementById('masterToggle').checked = this.settings.enabled;
    document.getElementById('ghostsToggle').checked = this.settings.ghosts;
    document.getElementById('spidersToggle').checked = this.settings.spiders;
    document.getElementById('fogToggle').checked = this.settings.fog;
    document.getElementById('glitchesToggle').checked = this.settings.glitches;
    document.getElementById('corruptionToggle').checked = this.settings.corruption;
    document.getElementById('shadowsToggle').checked = this.settings.shadows;
    document.getElementById('bloodToggle').checked = this.settings.blood;
    document.getElementById('audioToggle').checked = this.settings.audio;
    document.getElementById('nightModeToggle').checked = this.settings.nightModeAggression;

    // Set slider values
    document.getElementById('intensitySlider').value = this.settings.intensity * 100;
    document.getElementById('intensityValue').textContent = Math.round(this.settings.intensity * 100) + '%';
    
    document.getElementById('ghostFreqSlider').value = this.settings.ghostFrequency * 100;
    document.getElementById('ghostFreqValue').textContent = Math.round(this.settings.ghostFrequency * 100) + '%';
    
    document.getElementById('spiderFreqSlider').value = this.settings.spiderFrequency * 100;
    document.getElementById('spiderFreqValue').textContent = Math.round(this.settings.spiderFrequency * 100) + '%';
    
    document.getElementById('distortionFreqSlider').value = this.settings.distortionFrequency * 100;
    document.getElementById('distortionFreqValue').textContent = Math.round(this.settings.distortionFrequency * 100) + '%';
    
    document.getElementById('audioVolumeSlider').value = this.settings.audioVolume * 100;
    document.getElementById('audioVolumeValue').textContent = Math.round(this.settings.audioVolume * 100) + '%';

    // Render whitelist
    this.renderWhitelist();
  }

  renderWhitelist() {
    const container = document.getElementById('whitelistContainer');
    
    if (!this.settings.whitelist || this.settings.whitelist.length === 0) {
      container.innerHTML = '<div class="no-sites">No sites added</div>';
      return;
    }

    container.innerHTML = '';
    this.settings.whitelist.forEach((site) => {
      const item = document.createElement('div');
      item.className = 'site-item';
      
      const name = document.createElement('span');
      name.className = 'site-name';
      name.textContent = site;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-site';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => this.removeFromWhitelist(site));
      
      item.appendChild(name);
      item.appendChild(removeBtn);
      container.appendChild(item);
    });
  }

  async addToWhitelist() {
    const input = document.getElementById('whitelistInput');
    const site = input.value.trim().toLowerCase();
    
    if (!site) return;
    
    if (!this.settings.whitelist) {
      this.settings.whitelist = [];
    }
    
    if (this.settings.whitelist.includes(site)) {
      this.showNotification('Site already in whitelist');
      return;
    }
    
    this.settings.whitelist.push(site);
    await this.saveSettings();
    
    input.value = '';
    this.renderWhitelist();
    this.showNotification(`Added ${site} to whitelist`);
  }

  async removeFromWhitelist(site) {
    this.settings.whitelist = this.settings.whitelist.filter(s => s !== site);
    await this.saveSettings();
    this.renderWhitelist();
    this.showNotification(`Removed ${site} from whitelist`);
  }

  showNotification(message) {
    // Simple notification - could be enhanced
    console.log('Notification:', message);
    
    // Flash the panel header
    const header = document.querySelector('.panel-header');
    header.style.animation = 'none';
    setTimeout(() => {
      header.style.animation = '';
    }, 10);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
