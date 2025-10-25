// Utility functions

export function random(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(random(min, max));
}

export function randomChoice(array) {
  return array[randomInt(0, array.length)];
}

export function probability(chance) {
  return Math.random() < chance;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Check if current time is night (after 7PM)
export function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 19 || hour < 6;
}

// Check if domain is unsafe
export function isUnsafeDomain(url, unsafeDomains) {
  const hostname = new URL(url).hostname.toLowerCase();
  return unsafeDomains.some(domain => hostname.includes(domain));
}

// Check if site is whitelisted
export function isWhitelisted(url, whitelist) {
  const hostname = new URL(url).hostname;
  return whitelist.some(site => hostname.includes(site));
}

// Detect if in fullscreen or video call
export function isFullscreenOrCall() {
  return document.fullscreenElement !== null || 
         document.querySelector('video[autoplay]') !== null;
}

// Check for active form inputs
export function hasActiveForm() {
  const activeElement = document.activeElement;
  return activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.isContentEditable
  );
}

// Respect reduced motion preference
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Generate unique ID
export function generateId() {
  return `haunted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Create element with classes
export function createElement(tag, classes = [], attributes = {}) {
  const el = document.createElement(tag);
  if (classes.length) el.className = classes.join(' ');
  Object.entries(attributes).forEach(([key, value]) => {
    el.setAttribute(key, value);
  });
  return el;
}

// Get random position on screen
export function randomScreenPosition() {
  return {
    x: random(0, window.innerWidth),
    y: random(0, window.innerHeight)
  };
}

// Get random edge position
export function randomEdgePosition() {
  const edge = randomChoice(['top', 'right', 'bottom', 'left']);
  const positions = {
    top: { x: random(0, window.innerWidth), y: -100 },
    right: { x: window.innerWidth + 100, y: random(0, window.innerHeight) },
    bottom: { x: random(0, window.innerWidth), y: window.innerHeight + 100 },
    left: { x: -100, y: random(0, window.innerHeight) }
  };
  return { ...positions[edge], edge };
}

// Calculate distance between two points
export function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Ease functions
export const ease = {
  inQuad: t => t * t,
  outQuad: t => t * (2 - t),
  inOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  inCubic: t => t * t * t,
  outCubic: t => (--t) * t * t + 1,
  inOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
};
