// Audio synthesis system using Web Audio API
import { clamp } from './shared/utils.js';

export class HorrorAudio {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.volume = 0.5;
    this.initialized = false;
    this.droneOscillator = null;
  }

  // Initialize audio context (must be called after user interaction)
  async init() {
    if (this.initialized) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.volume;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  setVolume(volume) {
    this.volume = clamp(volume, 0, 1);
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  // Start ambient drone
  startDrone() {
    if (!this.initialized || this.droneOscillator) return;

    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 55; // Low A
    osc2.type = 'sine';
    osc2.frequency.value = 58.27; // Slightly detuned for beating effect

    filter.type = 'lowpass';
    filter.frequency.value = 200;

    gain.gain.value = 0.1;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.droneOscillator = { osc1, osc2, gain, filter };

    // Slowly modulate filter
    const modulate = () => {
      if (!this.droneOscillator) return;
      filter.frequency.value = 150 + Math.sin(Date.now() / 3000) * 50;
      requestAnimationFrame(modulate);
    };
    modulate();
  }

  stopDrone() {
    if (this.droneOscillator) {
      this.droneOscillator.osc1.stop();
      this.droneOscillator.osc2.stop();
      this.droneOscillator = null;
    }
  }

  // Whisper sound (noise burst with formants)
  playWhisper() {
    if (!this.initialized) return;

    const duration = 0.5 + Math.random() * 1;
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate pink noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;

    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000 + Math.random() * 2000;
    filter.Q.value = 5;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.context.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.context.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    source.stop(this.context.currentTime + duration);
  }

  // Heartbeat sound
  playHeartbeat() {
    if (!this.initialized) return;

    const beat = (delay) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.type = 'sine';
      osc.frequency.value = 60;

      gain.gain.setValueAtTime(0, this.context.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.3, this.context.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + delay + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.context.currentTime + delay);
      osc.stop(this.context.currentTime + delay + 0.3);
    };

    beat(0);
    beat(0.15);
  }

  // Crawling sound (random ticks and scratches)
  playCrawling() {
    if (!this.initialized) return;

    const duration = 1 + Math.random() * 2;
    const ticks = 10 + Math.floor(Math.random() * 20);

    for (let i = 0; i < ticks; i++) {
      const delay = (duration / ticks) * i + Math.random() * 0.1;
      
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const filter = this.context.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.value = 100 + Math.random() * 500;

      filter.type = 'highpass';
      filter.frequency.value = 2000;

      gain.gain.setValueAtTime(0, this.context.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.05, this.context.currentTime + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + delay + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(this.context.currentTime + delay);
      osc.stop(this.context.currentTime + delay + 0.05);
    }
  }

  // Random creepy sound
  playRandom() {
    const sounds = [
      () => this.playWhisper(),
      () => this.playHeartbeat(),
      () => this.playCrawling()
    ];
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    sound();
  }

  destroy() {
    this.stopDrone();
    if (this.context) {
      this.context.close();
    }
  }
}
