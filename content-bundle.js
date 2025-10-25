// ==========================================================================================
// HAUNTED WEB - Main Content Script
// ==========================================================================================

// ==========================================================================================
// CONSTANTS
// ==========================================================================================

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

const UNSAFE_DOMAINS = [
  'bank', 'paypal', 'stripe', 'checkout', 'payment',
  'gov', 'irs', 'medicare', 'healthcare',
  'login', 'signin', 'auth',
  'meet', 'zoom', 'teams', 'webex'
];

const MSG = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  PANIC: 'PANIC',
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE'
};

const GHOST_BEHAVIORS = ['slide', 'teleport', 'follow', 'peek', 'stare', 'crawl'];

const TIME = {
  GHOST_MIN: 5000,
  GHOST_MAX: 30000,
  SPIDER_MIN: 10000,
  SPIDER_MAX: 45000,
  CORRUPTION_MIN: 3000,
  CORRUPTION_MAX: 20000,
  INTENSITY_SCALE_INTERVAL: 60000,
  STARE_DURATION: 5000,
  CRAWL_DURATION: 10000,
  EVENT_COOLDOWN: 2000 // Minimum time between major events
};

// ==========================================================================================
// EVENT QUEUE SYSTEM - Prevents overlapping effects
// ==========================================================================================

class EventQueue {
  constructor() {
    this.isEventActive = false;
    this.lastEventTime = 0;
  }

  canStartEvent() {
    const now = Date.now();
    return !this.isEventActive && (now - this.lastEventTime) >= TIME.EVENT_COOLDOWN;
  }

  startEvent(duration) {
    this.isEventActive = true;
    this.lastEventTime = Date.now();
    setTimeout(() => {
      this.isEventActive = false;
    }, duration);
  }

  reset() {
    this.isEventActive = false;
  }
}

// ==========================================================================================
// UTILITY FUNCTIONS
// ==========================================================================================

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(random(min, max));
}

function randomChoice(array) {
  return array[randomInt(0, array.length)];
}

function probability(chance) {
  return Math.random() < chance;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6;
}

function isUnsafeDomain(url, unsafeDomains) {
  const hostname = new URL(url).hostname.toLowerCase();
  return unsafeDomains.some(domain => hostname.includes(domain));
}

function isWhitelisted(url, whitelist) {
  if (!whitelist || whitelist.length === 0) return false;
  const hostname = new URL(url).hostname;
  return whitelist.some(site => hostname.includes(site));
}

function isFullscreenOrCall() {
  return document.fullscreenElement !== null || 
         document.querySelector('video[autoplay]') !== null;
}

function hasActiveForm() {
  const activeElement = document.activeElement;
  return activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable
  );
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function generateId() {
  return `haunted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createElement(tag, classes = [], attributes = {}) {
  const el = document.createElement(tag);
  if (classes.length) el.className = classes.join(' ');
  Object.entries(attributes).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

function randomScreenPosition() {
  return {
    x: random(0, window.innerWidth),
    y: random(0, window.innerHeight)
  };
}

function randomEdgePosition() {
  const edge = randomChoice(['top', 'right', 'bottom', 'left']);
  const positions = {
    top: { x: random(0, window.innerWidth), y: -100 },
    right: { x: window.innerWidth + 100, y: random(0, window.innerHeight) },
    bottom: { x: random(0, window.innerWidth), y: window.innerHeight + 100 },
    left: { x: -100, y: random(0, window.innerHeight) }
  };
  return { ...positions[edge], edge };
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

const ease = {
  inQuad: t => t * t,
  outQuad: t => t * (2 - t),
  inOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  inCubic: t => t * t * t,
  outCubic: t => (--t) * t * t + 1,
  inOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};

// ==========================================================================================
// AUDIO SYSTEM
// ==========================================================================================

class HorrorAudio {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.volume = 0.5;
    this.initialized = false;
    this.droneOscillator = null;
  }

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

  startDrone() {
    if (!this.initialized || this.droneOscillator) return;

    const osc1 = this.context.createOscillator();
    const osc2 = this.context.createOscillator();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = 55;
    osc2.type = 'sine';
    osc2.frequency.value = 58.27;

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

  playWhisper() {
    if (!this.initialized) return;

    const duration = 0.5 + Math.random() * 1;
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

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

  destroy() {
    this.stopDrone();
    if (this.context) {
      this.context.close();
    }
  }
}

// ==========================================================================================
// GHOST SYSTEM
// ==========================================================================================

class Ghost {
  constructor(audioSystem) {
    this.id = generateId();
    this.audioSystem = audioSystem;
    this.element = null;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.behavior = randomChoice(GHOST_BEHAVIORS);
    this.canvas = null;
    this.ctx = null;
    this.animationFrame = null;
    this.startTime = Date.now();
    this.cursorX = 0;
    this.cursorY = 0;
  }

  create() {
    this.element = createElement('div', ['haunted-ghost'], {
      'data-id': this.id,
      'data-behavior': this.behavior
    });

    this.canvas = createElement('canvas');
    this.canvas.width = 150;
    this.canvas.height = 200;
    this.ctx = this.canvas.getContext('2d');
    this.element.appendChild(this.canvas);

    this.drawGhost();
    this.setupBehavior();

    document.body.appendChild(this.element);

    if (this.audioSystem && Math.random() < 0.3) {
      this.audioSystem.playWhisper();
    }

    return this;
  }

  drawGhost() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    const gradient = ctx.createRadialGradient(w/2, h/3, 10, w/2, h/3, w/2);
    gradient.addColorStop(0, 'rgba(200, 200, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(150, 150, 200, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 100, 150, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(w/2, h/4);
    
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI * i / 10;
      const x = w/2 + Math.cos(angle) * w/3;
      const y = h/4 + Math.sin(angle) * h/2.5;
      ctx.lineTo(x, y);
    }
    
    const waveCount = 6;
    for (let i = 0; i <= waveCount; i++) {
      const x = w - (i * w / waveCount);
      const y = h * 0.8 + Math.sin(i + Date.now() / 500) * 15;
      ctx.lineTo(x, y);
    }
    
    ctx.closePath();
    ctx.fill();

    const eyeGlow = ctx.createRadialGradient(w/2 - 20, h/3, 0, w/2 - 20, h/3, 15);
    eyeGlow.addColorStop(0, 'rgba(255, 100, 100, 1)');
    eyeGlow.addColorStop(1, 'rgba(255, 100, 100, 0)');
    
    ctx.fillStyle = eyeGlow;
    ctx.beginPath();
    ctx.arc(w/2 - 20, h/3, 8, 0, Math.PI * 2);
    ctx.fill();

    const eyeGlow2 = ctx.createRadialGradient(w/2 + 20, h/3, 0, w/2 + 20, h/3, 15);
    eyeGlow2.addColorStop(0, 'rgba(255, 100, 100, 1)');
    eyeGlow2.addColorStop(1, 'rgba(255, 100, 100, 0)');
    
    ctx.fillStyle = eyeGlow2;
    ctx.beginPath();
    ctx.arc(w/2 + 20, h/3, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  setupBehavior() {
    const behaviors = {
      'slide': () => this.setupSlide(),
      'teleport': () => this.setupTeleport(),
      'follow': () => this.setupFollow(),
      'peek': () => this.setupPeek(),
      'stare': () => this.setupStare(),
      'crawl': () => this.setupCrawl()
    };
    behaviors[this.behavior]();
  }

  setupSlide() {
    const startPos = randomEdgePosition();
    this.x = startPos.x;
    this.y = startPos.y;
    
    const oppositeEdges = {
      top: { x: random(0, window.innerWidth), y: window.innerHeight + 100 },
      bottom: { x: random(0, window.innerWidth), y: -100 },
      left: { x: window.innerWidth + 100, y: random(0, window.innerHeight) },
      right: { x: -100, y: random(0, window.innerHeight) }
    };
    
    const target = oppositeEdges[startPos.edge];
    this.targetX = target.x;
    this.targetY = target.y;

    this.animate();
  }

  setupTeleport() {
    const pos = randomScreenPosition();
    this.x = pos.x;
    this.y = pos.y;
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
    this.element.style.animation = 'haunted-ghost-teleport 0.3s ease-out';
    
    setTimeout(() => {
      this.element.style.animation = 'haunted-ghost-teleport-out 0.3s ease-in';
      setTimeout(() => this.destroy(), 300);
    }, random(2000, 5000));

    this.distortNearbyElements();
  }

  setupFollow() {
    const pos = randomEdgePosition();
    this.x = pos.x;
    this.y = pos.y;

    const trackCursor = (e) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
    };
    document.addEventListener('mousemove', trackCursor);

    this.animateFollow();

    setTimeout(() => {
      document.removeEventListener('mousemove', trackCursor);
      this.fadeOut();
    }, random(3000, 7000));
  }

  setupPeek() {
    const elements = Array.from(document.querySelectorAll('div, section, aside, nav, img'))
      .filter(el => el.offsetWidth > 100 && el.offsetHeight > 100);
    
    if (elements.length === 0) {
      this.setupSlide();
      return;
    }

    const hideElement = randomChoice(elements);
    const rect = hideElement.getBoundingClientRect();
    
    const edge = randomChoice(['left', 'right', 'top', 'bottom']);
    const positions = {
      left: { x: rect.left - 75, y: rect.top + rect.height / 2 },
      right: { x: rect.right + 75, y: rect.top + rect.height / 2 },
      top: { x: rect.left + rect.width / 2, y: rect.top - 100 },
      bottom: { x: rect.left + rect.width / 2, y: rect.bottom + 100 }
    };
    
    const pos = positions[edge];
    this.x = pos.x;
    this.y = pos.y;
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
    this.element.style.zIndex = '2147483646';
    this.element.style.animation = 'haunted-ghost-peek 3s ease-in-out';
    
    setTimeout(() => this.destroy(), 3000);
  }

  setupStare() {
    this.x = window.innerWidth / 2 + random(-200, 200);
    this.y = window.innerHeight / 2 + random(-150, 150);
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
    this.element.style.animation = 'haunted-ghost-stare 1s ease-out';
    
    setTimeout(() => {
      this.element.style.opacity = '0';
      setTimeout(() => this.destroy(), 100);
    }, TIME.STARE_DURATION);

    this.distortNearbyElements();
  }

  setupCrawl() {
    this.x = random(100, window.innerWidth - 100);
    this.y = window.innerHeight + 200;
    this.targetY = window.innerHeight - 250;
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
    
    this.animateCrawl();
    
    setTimeout(() => this.fadeOut(), TIME.CRAWL_DURATION);
  }

  animate() {
    const duration = 5000;
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      this.destroy();
      return;
    }

    this.x = this.x + (this.targetX - this.x) * 0.02;
    this.y = this.y + (this.targetY - this.y) * 0.02;
    
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';

    if (Math.random() < 0.1) this.drawGhost();

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  animateFollow() {
    const dist = distance(this.x, this.y, this.cursorX, this.cursorY);
    
    if (dist > 50) {
      const angle = Math.atan2(this.cursorY - this.y, this.cursorX - this.x);
      this.x += Math.cos(angle) * 3;
      this.y += Math.sin(angle) * 3;
      
      this.element.style.left = this.x + 'px';
      this.element.style.top = this.y + 'px';
    }

    if (Math.random() < 0.05) this.drawGhost();

    this.animationFrame = requestAnimationFrame(() => this.animateFollow());
  }

  animateCrawl() {
    const duration = 3000;
    const elapsed = Date.now() - this.startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      cancelAnimationFrame(this.animationFrame);
      return;
    }

    this.y = this.y + (this.targetY - this.y) * 0.01;
    
    this.element.style.top = this.y + 'px';

    if (Math.random() < 0.1) this.drawGhost();

    this.animationFrame = requestAnimationFrame(() => this.animateCrawl());
  }

  distortNearbyElements() {
    const nearby = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a'))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        const elX = rect.left + rect.width / 2;
        const elY = rect.top + rect.height / 2;
        return distance(this.x, this.y, elX, elY) < 300;
      });

    nearby.forEach(el => {
      el.style.transition = 'transform 0.5s ease-out';
      el.style.transform = `skewX(${random(-5, 5)}deg) scaleY(${random(0.95, 1.05)})`;
      
      setTimeout(() => {
        el.style.transform = '';
      }, 1000);
    });
  }

  fadeOut() {
    this.element.style.transition = 'opacity 0.5s';
    this.element.style.opacity = '0';
    setTimeout(() => this.destroy(), 500);
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

class GhostManager {
  constructor(audioSystem, settings, eventQueue) {
    this.audioSystem = audioSystem;
    this.settings = settings;
    this.eventQueue = eventQueue;
    this.ghosts = [];
    this.timers = [];
  }

  start() {
    this.scheduleGhost();
  }

  scheduleGhost() {
    const baseInterval = TIME.GHOST_MIN + (1 - this.settings.ghostFrequency) * (TIME.GHOST_MAX - TIME.GHOST_MIN);
    const interval = baseInterval + random(-5000, 5000);
    
    const timer = setTimeout(() => {
      if (this.settings.enabled && this.settings.ghosts && this.eventQueue.canStartEvent()) {
        this.spawnGhost();
      }
      this.scheduleGhost();
    }, interval);
    
    this.timers.push(timer);
  }

  spawnGhost() {
    const ghost = new Ghost(this.audioSystem);
    ghost.create();
    this.ghosts.push(ghost);
    
    // Mark event as active for typical ghost duration
    this.eventQueue.startEvent(8000);

    setTimeout(() => {
      const index = this.ghosts.indexOf(ghost);
      if (index > -1) {
        this.ghosts.splice(index, 1);
      }
    }, 15000);
  }

  stop() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
    this.ghosts.forEach(ghost => ghost.destroy());
    this.ghosts = [];
  }

  updateSettings(settings) {
    this.settings = settings;
  }
}

// ==========================================================================================
// SPIDER SYSTEM
// ==========================================================================================

class Spider {
  constructor(audioSystem) {
    this.id = generateId();
    this.audioSystem = audioSystem;
    this.element = null;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.speed = random(1, 3);
    this.animationFrame = null;
    this.behavior = randomChoice(['walk', 'drop', 'inspect']);
    this.cursorX = 0;
    this.cursorY = 0;
    this.fleeing = false;
  }

  create() {
    this.element = createElement('div', ['haunted-spider'], { 'data-id': this.id });

    const body = createElement('div', ['spider-body']);
    for (let i = 0; i < 8; i++) {
      const leg = createElement('div', ['spider-leg', `spider-leg-${i + 1}`]);
      const segment1 = createElement('div', ['leg-segment', 'segment-1']);
      const segment2 = createElement('div', ['leg-segment', 'segment-2']);
      leg.appendChild(segment1);
      leg.appendChild(segment2);
      body.appendChild(leg);
    }
    const eye1 = createElement('div', ['spider-eye', 'spider-eye-1']);
    const eye2 = createElement('div', ['spider-eye', 'spider-eye-2']);
    body.appendChild(eye1); body.appendChild(eye2);
    this.element.appendChild(body);

    this.element.addEventListener('mouseenter', () => this.flee());

    this.setupBehavior();
    document.body.appendChild(this.element);

    if (this.audioSystem && Math.random() < 0.4) this.audioSystem.playCrawling();
    return this;
  }

  setupBehavior() {
    if (this.behavior === 'walk') this.setupWalk();
    else if (this.behavior === 'drop') this.setupDrop();
    else this.setupInspect();
  }

  setupWalk() {
    const startPos = randomEdgePosition();
    this.x = startPos.x; 
    this.y = startPos.y;
    
    // Spider crawls across screen with random waypoints
    this.waypoints = [];
    const numWaypoints = randomInt(2, 5);
    
    for (let i = 0; i < numWaypoints; i++) {
      // Create waypoints that make spiders crawl around the edges and across the screen
      if (Math.random() < 0.5) {
        // Edge crawling - follow screen perimeter
        const edge = randomChoice(['top', 'right', 'bottom', 'left']);
        const edgePos = {
          top: { x: random(100, window.innerWidth - 100), y: random(-50, 100) },
          right: { x: window.innerWidth - random(-50, 100), y: random(100, window.innerHeight - 100) },
          bottom: { x: random(100, window.innerWidth - 100), y: window.innerHeight - random(-50, 100) },
          left: { x: random(-50, 100), y: random(100, window.innerHeight - 100) }
        };
        this.waypoints.push(edgePos[edge]);
      } else {
        // Crossing screen
        this.waypoints.push({
          x: random(100, window.innerWidth - 100),
          y: random(100, window.innerHeight - 100)
        });
      }
    }
    
    // Final target off-screen
    const exitEdge = randomChoice(['top', 'right', 'bottom', 'left']);
    const exits = {
      top: { x: random(0, window.innerWidth), y: -50 },
      bottom: { x: random(0, window.innerWidth), y: window.innerHeight + 50 },
      left: { x: -50, y: random(0, window.innerHeight) },
      right: { x: window.innerWidth + 50, y: random(0, window.innerHeight) }
    };
    this.waypoints.push(exits[exitEdge]);
    
    this.currentWaypointIndex = 0;
    this.targetX = this.waypoints[0].x;
    this.targetY = this.waypoints[0].y;
    this.animateWalk();
  }

  setupDrop() {
    this.x = random(100, window.innerWidth - 100);
    this.y = -50; this.targetY = random(200, 400);
    this.element.classList.add('spider-dropping');
    const thread = createElement('div', ['spider-thread']);
    thread.style.left = '50%'; thread.style.top = '0'; thread.style.height = '0';
    this.element.appendChild(thread);
    this.animateDrop(thread);
  }

  setupInspect() {
    const track = (e) => { this.cursorX = e.clientX; this.cursorY = e.clientY; };
    document.addEventListener('mousemove', track);
    const pos = randomEdgePosition(); this.x = pos.x; this.y = pos.y;
    this.animateInspect();
    setTimeout(() => { document.removeEventListener('mousemove', track); this.destroy(); }, random(5000, 10000));
  }

  animateWalk() {
    if (this.fleeing) { 
      this.animationFrame = requestAnimationFrame(() => this.animateWalk()); 
      return; 
    }
    
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    
    // Reached waypoint, move to next
    if (dist < 10) {
      this.currentWaypointIndex++;
      if (this.currentWaypointIndex >= this.waypoints.length) {
        this.destroy();
        return;
      }
      this.targetX = this.waypoints[this.currentWaypointIndex].x;
      this.targetY = this.waypoints[this.currentWaypointIndex].y;
    }
    
    const angle = Math.atan2(dy, dx);
    
    // Add slight random wobble to movement for more natural crawling
    const wobble = Math.sin(Date.now() / 200) * 0.3;
    this.x += Math.cos(angle + wobble) * this.speed;
    this.y += Math.sin(angle + wobble) * this.speed;
    
    const rotation = (angle * 180 / Math.PI) + 90;
    this.element.style.transform = `rotate(${rotation}deg)`;
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
    
    this.animationFrame = requestAnimationFrame(() => this.animateWalk());
  }

  animateDrop(thread) {
    const dur = 2000, start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      this.y = -50 + (this.targetY + 50) * p; thread.style.height = (this.y + 50) + 'px';
      this.element.style.top = this.y + 'px'; this.element.style.left = this.x + 'px';
      if (p < 1) this.animationFrame = requestAnimationFrame(tick);
      else setTimeout(() => this.animateClimbUp(thread), random(1000, 3000));
    }; tick();
  }

  animateClimbUp(thread) {
    const dur = 1500, startY = this.y, start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      this.y = startY - (startY + 50) * p; thread.style.height = (this.y + 50) + 'px';
      this.element.style.top = this.y + 'px';
      if (p < 1) this.animationFrame = requestAnimationFrame(tick); else this.destroy();
    }; tick();
  }

  animateInspect() {
    const dist = distance(this.x, this.y, this.cursorX, this.cursorY);
    if (dist > 150) {
      const a = Math.atan2(this.cursorY - this.y, this.cursorX - this.x); this.x += Math.cos(a) * this.speed; this.y += Math.sin(a) * this.speed; this.element.style.transform = `rotate(${(a*180/Math.PI)+90}deg)`;
    } else if (dist < 100) {
      const a = Math.atan2(this.cursorY - this.y, this.cursorX - this.x); this.x -= Math.cos(a) * this.speed; this.y -= Math.sin(a) * this.speed; this.element.style.transform = `rotate(${(a*180/Math.PI)-90}deg)`;
    }
    this.element.style.left = this.x + 'px'; this.element.style.top = this.y + 'px';
    if (!this.fleeing) this.animationFrame = requestAnimationFrame(() => this.animateInspect());
  }

  flee() {
    if (this.fleeing) return; this.fleeing = true; this.speed = 8;
    const edges = [ { x: -100, y: this.y }, { x: window.innerWidth + 100, y: this.y }, { x: this.x, y: -100 }, { x: this.x, y: window.innerHeight + 100 } ];
    const nearest = edges.reduce((c, e) => { const d = distance(this.x, this.y, e.x, e.y); return d < c.dist ? { edge: e, dist: d } : c; }, { dist: Infinity }).edge;
    this.targetX = nearest.x; this.targetY = nearest.y; cancelAnimationFrame(this.animationFrame); this.animateWalk();
  }

  destroy() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    if (this.element && this.element.parentNode) this.element.parentNode.removeChild(this.element);
  }
}

class SpiderManager {
  constructor(audioSystem, settings, eventQueue) {
    this.audioSystem = audioSystem;
    this.settings = settings;
    this.eventQueue = eventQueue;
    this.spiders = [];
    this.timers = [];
  }
  
  start() {
    this.scheduleSpider();
  }
  
  scheduleSpider() {
    const base = TIME.SPIDER_MIN + (1 - this.settings.spiderFrequency) * (TIME.SPIDER_MAX - TIME.SPIDER_MIN);
    const interval = base + random(-5000, 5000);
    const timer = setTimeout(() => {
      if (this.settings.enabled && this.settings.spiders && this.eventQueue.canStartEvent()) {
        this.spawnSpider();
      }
      this.scheduleSpider();
    }, interval);
    this.timers.push(timer);
  }
  
  spawnSpider() {
    console.log('SpiderManager: spawnSpider called (will create spiders)');
    const count = probability(0.1) ? randomInt(2, 5) : 1;
    
    // Mark event as active while spiders are crawling
    this.eventQueue.startEvent(12000);
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const s = new Spider(this.audioSystem).create();
        this.spiders.push(s);
        setTimeout(() => {
          const idx = this.spiders.indexOf(s);
          if (idx > -1) this.spiders.splice(idx, 1);
        }, 20000);
      }, i * 500);
    }
  }
  
  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.spiders.forEach(s => s.destroy());
    this.spiders = [];
  }
  
  updateSettings(settings) {
    this.settings = settings;
  }
}

// ==========================================================================================
// CORRUPTION EFFECTS
// ==========================================================================================

class CorruptionManager {
  constructor(settings, eventQueue) {
    this.settings = settings;
    this.eventQueue = eventQueue;
    this.timers = [];
  }
  
  start() {
    this.scheduleCorruption();
  }
  
  scheduleCorruption() {
    const base = TIME.CORRUPTION_MIN + (1 - this.settings.distortionFrequency) * (TIME.CORRUPTION_MAX - TIME.CORRUPTION_MIN);
    const interval = base + random(-2000, 2000);
    const timer = setTimeout(() => {
      if (this.settings.enabled && this.settings.corruption && this.eventQueue.canStartEvent()) {
        this.applyRandomCorruption();
      }
      this.scheduleCorruption();
    }, interval);
    this.timers.push(timer);
  }
  
  applyRandomCorruption() {
    const effects = [
      () => this.textMutation(),
      () => this.layoutTilt(),
      () => this.cursorCorruption(),
      () => this.colorShift(),
      () => this.linkSabotage()
    ];
    
    // Mark event as active for corruption duration
    this.eventQueue.startEvent(4000);
    
    randomChoice(effects)();
  }
  textMutation() {
    const els = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li')).filter(el => (el.textContent||'').trim().length > 0);
    if (!els.length) return; const count = randomInt(1, Math.min(5, els.length));
    for (let i=0;i<count;i++) {
      const el = randomChoice(els); const t0 = el.style.transform, f0 = el.style.filter;
      const mutations = [ { transform: 'scaleX(-1)', filter: 'none' }, { transform: 'scaleY(1.5) scaleX(0.8)', filter: 'none' }, { transform: `skewX(${random(-20,20)}deg)`, filter: 'none' }, { transform: `translateY(${random(5,15)}px)`, filter: 'blur(2px)' } ];
      const m = randomChoice(mutations); el.style.transition='all 0.3s ease-out'; el.style.transform=m.transform; el.style.filter=m.filter;
      setTimeout(()=>{ el.style.transform=t0; el.style.filter=f0; }, random(1000,3000));
    }
  }
  layoutTilt() { const t0 = document.body.style.transform; const angle = random(-2,2); document.body.style.transition='transform 0.5s ease-out'; document.body.style.transform=`rotate(${angle}deg)`; setTimeout(()=>{ document.body.style.transform = t0; }, random(2000,4000)); }
  cursorCorruption() {
    const cursor = createElement('div', ['haunted-cursor-trail']); document.body.appendChild(cursor);
    let x=0,y=0; const trail=[]; const len=10; const onMove=(e)=>{ x=e.clientX; y=e.clientY; };
    document.addEventListener('mousemove', onMove);
    const interval = setInterval(()=>{ trail.push({x,y}); if (trail.length>len) trail.shift(); cursor.style.left=x+'px'; cursor.style.top=y+'px'; let html=''; trail.forEach((p,i)=>{ const o=i/len; const s=10+(i/len)*20; html+=`<div style="position:absolute;left:${p.x}px;top:${p.y}px;width:${s}px;height:${s}px;background:rgba(255,0,0,${o*0.3});border-radius:50%;pointer-events:none;"></div>`; }); cursor.innerHTML=html; },50);
    setTimeout(()=>{ clearInterval(interval); document.removeEventListener('mousemove', onMove); if (cursor.parentNode) cursor.parentNode.removeChild(cursor); }, random(3000,6000));
  }
  colorShift() { const f0 = document.body.style.filter; document.body.style.transition='filter 0.5s ease-out'; document.body.style.filter='hue-rotate(180deg) saturate(0.5) brightness(0.8)'; setTimeout(()=>{ document.body.style.filter=f0; }, random(1000,3000)); }
  linkSabotage() {
    const links = Array.from(document.querySelectorAll('a')); if (!links.length) return; const count = Math.min(randomInt(3,10), links.length); const selected=[]; for(let i=0;i<count;i++) selected.push(randomChoice(links));
    selected.forEach(link=>{ const t0 = link.style.transform; const onEnter=()=>{ link.style.transition='transform 0.1s ease-out'; link.style.transform=`translateX(${random(-10,10)}px) translateY(${random(-10,10)}px)`; }; const onLeave=()=>{ link.style.transform=t0; };
      link.addEventListener('mouseenter', onEnter); link.addEventListener('mouseleave', onLeave); setTimeout(()=>{ link.removeEventListener('mouseenter', onEnter); link.removeEventListener('mouseleave', onLeave); link.style.transform=t0; }, random(5000,10000));
    });
  }
  stop(){ this.timers.forEach(clearTimeout); this.timers=[]; }
  updateSettings(s){ this.settings=s; }
}

// ==========================================================================================
// ENVIRONMENTAL EFFECTS
// ==========================================================================================

class EnvironmentManager {
  constructor(settings){ this.settings=settings; this.fogCanvas=null; this.fogCtx=null; this.fogParticles=[]; this.fogAnimationFrame=null; this.effectTimers=[]; }
  start(){ if(this.settings.fog) this.startFog(); this.scheduleShadows(); this.scheduleGlitches(); this.scheduleBlood(); this.scheduleFlickers(); }
  startFog(){ this.fogCanvas=createElement('canvas',['haunted-fog']); this.fogCanvas.width=window.innerWidth; this.fogCanvas.height=window.innerHeight; this.fogCtx=this.fogCanvas.getContext('2d'); document.body.appendChild(this.fogCanvas);
    for(let i=0;i<50;i++){ this.fogParticles.push({ x:random(0,window.innerWidth), y:random(0,window.innerHeight), size:random(100,300), speedX:random(-0.5,0.5), speedY:random(-0.3,0.3), opacity:random(0.05,0.15) }); }
    this.animateFog(); window.addEventListener('resize', ()=>{ if(this.fogCanvas){ this.fogCanvas.width=window.innerWidth; this.fogCanvas.height=window.innerHeight; } }); }
  animateFog(){ if(!this.fogCtx) return; const w=this.fogCanvas.width,h=this.fogCanvas.height; this.fogCtx.clearRect(0,0,w,h); this.fogParticles.forEach(p=>{ p.x+=p.speedX; p.y+=p.speedY; if(p.x<-p.size) p.x=w+p.size; if(p.x>w+p.size) p.x=-p.size; if(p.y<-p.size) p.y=h+p.size; if(p.y>h+p.size) p.y=-p.size; const g=this.fogCtx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size); g.addColorStop(0,`rgba(200,200,220,${p.opacity})`); g.addColorStop(1,'rgba(200,200,220,0)'); this.fogCtx.fillStyle=g; this.fogCtx.fillRect(p.x-p.size,p.y-p.size,p.size*2,p.size*2); }); this.fogAnimationFrame=requestAnimationFrame(()=>this.animateFog()); }
  stopFog(){ if(this.fogAnimationFrame) cancelAnimationFrame(this.fogAnimationFrame); if(this.fogCanvas&&this.fogCanvas.parentNode) this.fogCanvas.parentNode.removeChild(this.fogCanvas); this.fogCanvas=null; this.fogCtx=null; this.fogParticles=[]; }
  scheduleShadows(){ const spawn=()=>{ if(!this.settings.enabled||!this.settings.shadows) return; const shadow=createElement('div',['haunted-shadow']); const edge=randomChoice(['top','right','bottom','left']); shadow.classList.add(`shadow-${edge}`); document.body.appendChild(shadow); setTimeout(()=>{ if(shadow.parentNode) shadow.parentNode.removeChild(shadow); },5000); };
    const schedule=()=>{ spawn(); const t=setTimeout(schedule, random(10000,30000)); this.effectTimers.push(t); }; schedule(); }
  scheduleGlitches(){ const glitch=()=>{ if(!this.settings.enabled||!this.settings.glitches) return; const overlay=createElement('div',['haunted-glitch']); document.body.appendChild(overlay); const type=randomChoice(['rgb-split','static','tear']); overlay.classList.add(`glitch-${type}`); setTimeout(()=>{ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); }, random(100,400)); };
    const schedule=()=>{ glitch(); const t=setTimeout(schedule, random(15000,45000)); this.effectTimers.push(t); }; schedule(); }
  scheduleBlood(){ const dripOnce=()=>{ if(!this.settings.enabled||!this.settings.blood) return; const drip=createElement('div',['haunted-blood-drip']); drip.style.left=random(0,window.innerWidth)+'px'; drip.style.animationDuration=random(2,4)+'s'; document.body.appendChild(drip); setTimeout(()=>{ if(drip.parentNode) drip.parentNode.removeChild(drip); },5000); };
    const schedule=()=>{ const c=randomInt(1,3); for(let i=0;i<c;i++) setTimeout(()=>dripOnce(), i*500); const t=setTimeout(schedule, random(20000,60000)); this.effectTimers.push(t); }; schedule(); }
  scheduleFlickers(){ const schedule=()=>{ if(Math.random()<0.2) this.pageFlicker(); const t=setTimeout(schedule, random(20000,60000)); this.effectTimers.push(t); }; schedule(); }
  pageFlicker(){ const overlay=createElement('div',['haunted-flicker-overlay']); for(let i=0;i<randomInt(1,3);i++){ const s=createElement('div',['haunted-silhouette']); s.style.left=random(10,80)+'%'; s.style.top=random(20,60)+'%'; s.style.width=random(100,200)+'px'; s.style.height=random(150,300)+'px'; overlay.appendChild(s); } document.body.appendChild(overlay); const seq=[100,300,100,400,100]; let total=0; seq.forEach((d,i)=>{ setTimeout(()=>{ overlay.style.opacity = i%2===0?'1':'0'; }, total); total+=d; }); setTimeout(()=>{ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); }, total); }
  stop(){ this.stopFog(); this.effectTimers.forEach(clearTimeout); this.effectTimers=[]; }
  updateSettings(s){ this.settings=s; if(s.fog && !this.fogCanvas) this.startFog(); else if(!s.fog && this.fogCanvas) this.stopFog(); }
}

// ==========================================================================================
// MAIN ORCHESTRATOR
// ==========================================================================================

class HauntedWeb {
  constructor() {
    this.settings = null;
    this.audio = null;
    this.eventQueue = null;
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
    
    this.settings = await this.getSettings();
    
    if (this.shouldDisable()) {
      console.log('Haunted Web: Disabled on this site for safety');
      return;
    }
    
    if (prefersReducedMotion()) {
      this.settings.intensity = Math.min(this.settings.intensity, 0.2);
    }
    
    this.intensity = this.settings.intensity;
    this.eventQueue = new EventQueue();
    this.audio = new HorrorAudio();
    this.ghostManager = new GhostManager(this.audio, this.settings, this.eventQueue);
    this.spiderManager = new SpiderManager(this.audio, this.settings, this.eventQueue);
    this.corruptionManager = new CorruptionManager(this.settings, this.eventQueue);
    this.environmentManager = new EnvironmentManager(this.settings);
    
    this.initAudioOnInteraction();
    if (this.settings.enabled) this.start();
    this.setupMessageListener();
    this.startIntensityScaling();
    this.startSafetyChecks();
    this.initialized = true;

    // Debug: log settings so it's easy to verify spiders/ghost toggles
    try { console.log('Haunted Web: Initialized', this.settings); } catch (e) {}
  }
  async getSettings(){ return new Promise((resolve)=>{ try { chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }, (res)=>{ if(res&&res.success) resolve(res.settings); else resolve(DEFAULTS); }); } catch(e){ resolve(DEFAULTS); } }); }
  isLoginPage(){ return !!(document.querySelector('input[type="password"]') || document.querySelector('form[action*="login" i], form[action*="signin" i]')); }
  shouldDisable(){ const url=window.location.href; if(this.settings.whitelist && isWhitelisted(url,this.settings.whitelist)) return true; if(isUnsafeDomain(url, UNSAFE_DOMAINS)) return true; if(this.isLoginPage()) return true; return false; }
  initAudioOnInteraction(){ const init=async()=>{ await this.audio.init(); if(this.settings.audio && this.settings.enabled){ this.audio.setVolume(this.settings.audioVolume); this.audio.startDrone(); } document.removeEventListener('click', init); document.removeEventListener('keydown', init); }; document.addEventListener('click', init, { once:true }); document.addEventListener('keydown', init, { once:true }); }
  start(){ if(!this.enabled) return; this.enabled=true; const nightBoost = this.settings.nightModeAggression && isNightTime() ? 1.5 : 1; const boosted = { ...this.settings, ghostFrequency: Math.min(this.settings.ghostFrequency*nightBoost,1), spiderFrequency: Math.min(this.settings.spiderFrequency*nightBoost,1), distortionFrequency: Math.min(this.settings.distortionFrequency*nightBoost,1) };
    this.ghostManager.updateSettings(boosted); this.spiderManager.updateSettings(boosted); this.corruptionManager.updateSettings(boosted); this.environmentManager.updateSettings(boosted);
    if(this.settings.ghosts) this.ghostManager.start(); if(this.settings.spiders) this.spiderManager.start(); if(this.settings.corruption) this.corruptionManager.start(); this.environmentManager.start(); if(this.audio&&this.audio.initialized&&this.settings.audio) this.audio.startDrone(); }
  stop(){ this.enabled=false; if(this.ghostManager) this.ghostManager.stop(); if(this.spiderManager) this.spiderManager.stop(); if(this.corruptionManager) this.corruptionManager.stop(); if(this.environmentManager) this.environmentManager.stop(); if(this.audio) this.audio.stopDrone(); }
  panic() {
    this.stop();
    this.cleanup();
    if (this.eventQueue) this.eventQueue.reset();
  }
  cleanup(){ const els=document.querySelectorAll('[class^="haunted-"], [class*=" haunted-"]'); els.forEach(el=>{ if(el.parentNode) el.parentNode.removeChild(el); }); document.body.style.transform=''; document.body.style.filter=''; }
  startIntensityScaling(){ this.intensityTimer=setInterval(()=>{ this.timeOnPage += TIME.INTENSITY_SCALE_INTERVAL; const scale = 1 + Math.min(this.timeOnPage/300000, 1); this.intensity = this.settings.intensity * scale; if(this.enabled){ const s={ ...this.settings, intensity:this.intensity }; this.ghostManager.updateSettings(s); this.spiderManager.updateSettings(s); this.corruptionManager.updateSettings(s); this.environmentManager.updateSettings(s); } }, TIME.INTENSITY_SCALE_INTERVAL); }
  startSafetyChecks(){ this.safetyCheckTimer=setInterval(()=>{ if(isFullscreenOrCall() || hasActiveForm() || this.isLoginPage()){ if(this.enabled) this.stop(); } else if(!this.enabled && this.settings.enabled){ this.start(); } }, 1000); }
  setupMessageListener(){ try { chrome.runtime.onMessage.addListener((req)=>{ switch(req.type){ case MSG.UPDATE_SETTINGS: this.settings={...this.settings,...req.settings}; this.updateFromSettings(); break; case MSG.PANIC: this.panic(); break; case MSG.ENABLE: this.settings.enabled=true; this.start(); break; case MSG.DISABLE: this.settings.enabled=false; this.stop(); break; } }); } catch(e){} }
  updateFromSettings(){ if(this.audio){ this.audio.setVolume(this.settings.audioVolume); if(this.settings.audio && !this.audio.droneOscillator) this.audio.startDrone(); else if(!this.settings.audio && this.audio.droneOscillator) this.audio.stopDrone(); }
    if(this.settings.enabled && !this.enabled) this.start(); else if(!this.settings.enabled && this.enabled) this.stop(); else if(this.enabled){ this.ghostManager.updateSettings(this.settings); this.spiderManager.updateSettings(this.settings); this.corruptionManager.updateSettings(this.settings); this.environmentManager.updateSettings(this.settings); } }

  // Debug helper to spawn a spider manually from the console
  debugSpawnSpider() {
    try {
      if (this.spiderManager && typeof this.spiderManager.spawnSpider === 'function') {
        this.spiderManager.spawnSpider();
        console.log('Haunted Web: debugSpawnSpider invoked');
        return true;
      }
    } catch (e) {
      console.error('debugSpawnSpider error', e);
    }
    return false;
  }
  destroy(){ if(this.intensityTimer) clearInterval(this.intensityTimer); if(this.safetyCheckTimer) clearInterval(this.safetyCheckTimer); this.stop(); this.cleanup(); if(this.audio) this.audio.destroy(); }
}

// Initialize
// Initialize and expose instance for debugging/inspection
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      window.hauntedWeb = new HauntedWeb();
      window.hauntedWeb.init();
      console.log('Haunted Web instance attached to window.hauntedWeb');
    } catch (e) {
      console.error('Failed to initialize HauntedWeb instance', e);
    }
  });
} else {
  try {
    window.hauntedWeb = new HauntedWeb();
    window.hauntedWeb.init();
    console.log('Haunted Web instance attached to window.hauntedWeb');
  } catch (e) {
    console.error('Failed to initialize HauntedWeb instance', e);
  }
}
