// Shared constants for the extension
export const DEFAULTS = {
  enabled: true,
  intensity: 0.5,
  ghostFrequency: 0.3,
  spiderFrequency: 0.2,
  distortionFrequency: 0.4,
  audioVolume: 0.5,
  nightModeAggression: true,
  
  // Feature toggles
  ghosts: true,
  spiders: true,
  fog: true,
  audio: true,
  glitches: true,
  corruption: true,
  shadows: true,
  blood: true,
  
  // Safety
  whitelist: [],
  blacklist: []
};

// Sites to auto-disable on
export const UNSAFE_DOMAINS = [
  'bank', 'paypal', 'stripe', 'checkout', 'payment',
  'gov', 'irs', 'medicare', 'healthcare',
  'login', 'signin', 'auth',
  'meet', 'zoom', 'teams', 'webex'
];

// Messages
export const MSG = {
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  PANIC: 'PANIC',
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE'
};

// Ghost behaviors
export const GHOST_BEHAVIORS = [
  'slide',
  'teleport',
  'follow',
  'peek',
  'stare',
  'crawl'
];

// Time thresholds (ms)
export const TIME = {
  GHOST_MIN: 5000,
  GHOST_MAX: 30000,
  SPIDER_MIN: 10000,
  SPIDER_MAX: 45000,
  CORRUPTION_MIN: 3000,
  CORRUPTION_MAX: 20000,
  INTENSITY_SCALE_INTERVAL: 60000, // Scale intensity every minute
  STARE_DURATION: 5000,
  CRAWL_DURATION: 10000
};
