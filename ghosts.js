import { random, randomInt, randomChoice, randomEdgePosition, randomScreenPosition, generateId, distance, ease, createElement } from './shared/utils.js';
import { GHOST_BEHAVIORS, TIME } from './shared/constants.js';

export class Ghost {
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
    switch (this.behavior) {
      case 'slide':
        this.setupSlide();
        break;
      case 'teleport':
        this.setupTeleport();
        break;
      case 'follow':
        this.setupFollow();
        break;
      case 'peek':
        this.setupPeek();
        break;
      case 'stare':
        this.setupStare();
        break;
      case 'crawl':
        this.setupCrawl();
        break;
    }
  }

  setupSlide() {
    const startPos = randomEdgePosition();
    this.x = startPos.x;
    this.y = startPos.y;
    
    // Target opposite edge
    const oppositeEdges = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left'
    };
    
    const targetEdge = oppositeEdges[startPos.edge];
    const targetPositions = {
      top: { x: random(0, window.innerWidth), y: -100 },
      bottom: { x: random(0, window.innerWidth), y: window.innerHeight + 100 },
      left: { x: -100, y: random(0, window.innerHeight) },
      right: { x: window.innerWidth + 100, y: random(0, window.innerHeight) }
    };
    
    const target = targetPositions[targetEdge];
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

    // Stop following after random time
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
    this.element.style.zIndex = '2147483646'; // Behind other haunted elements
    
    // Peek animation
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

    const easedProgress = ease.inOutQuad(progress);
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

    const easedProgress = ease.outCubic(progress);
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

export class GhostManager {
  constructor(audioSystem, settings) {
    this.audioSystem = audioSystem;
    this.settings = settings;
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
      if (this.settings.enabled && this.settings.ghosts) {
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
