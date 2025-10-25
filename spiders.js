// Spider creature system with CSS rendering
import { random, randomInt, randomChoice, randomEdgePosition, generateId, distance, createElement } from './shared/utils.js';
import { TIME } from './shared/constants.js';

export class Spider {
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
    this.element = createElement('div', ['haunted-spider'], {
      'data-id': this.id
    });

    // Create spider body
    const body = createElement('div', ['spider-body']);
    
    // Create 8 legs
    for (let i = 0; i < 8; i++) {
      const leg = createElement('div', ['spider-leg', `spider-leg-${i + 1}`]);
      const segment1 = createElement('div', ['leg-segment', 'segment-1']);
      const segment2 = createElement('div', ['leg-segment', 'segment-2']);
      leg.appendChild(segment1);
      leg.appendChild(segment2);
      body.appendChild(leg);
    }

    // Add eyes
    const eye1 = createElement('div', ['spider-eye', 'spider-eye-1']);
    const eye2 = createElement('div', ['spider-eye', 'spider-eye-2']);
    body.appendChild(eye1);
    body.appendChild(eye2);

    this.element.appendChild(body);

    // Setup behavior
    this.setupBehavior();

    document.body.appendChild(this.element);

    // Setup hover interaction
    this.element.addEventListener('mouseenter', () => this.flee());

    // Play crawling sound
    if (this.audioSystem && Math.random() < 0.5) {
      this.audioSystem.playCrawling();
    }

    return this;
  }

  setupBehavior() {
    switch (this.behavior) {
      case 'walk':
        this.setupWalk();
        break;
      case 'drop':
        this.setupDrop();
        break;
      case 'inspect':
        this.setupInspect();
        break;
    }
  }

  setupWalk() {
    // Start from random edge
    const startPos = randomEdgePosition();
    this.x = startPos.x;
    this.y = startPos.y;
    
    // Walk to opposite side
    const oppositeEdges = {
      top: { x: random(0, window.innerWidth), y: window.innerHeight + 50 },
      bottom: { x: random(0, window.innerWidth), y: -50 },
      left: { x: window.innerWidth + 50, y: random(0, window.innerHeight) },
      right: { x: -50, y: random(0, window.innerHeight) }
    };
    
    const target = oppositeEdges[startPos.edge];
    this.targetX = target.x;
    this.targetY = target.y;

    this.animateWalk();
  }

  setupDrop() {
    // Drop from top on silk thread
    this.x = random(100, window.innerWidth - 100);
    this.y = -50;
    this.targetY = random(200, 400);
    
    this.element.classList.add('spider-dropping');
    
    // Create silk thread
    const thread = createElement('div', ['spider-thread']);
    thread.style.left = '50%';
    thread.style.top = '0';
    thread.style.height = '0';
    this.element.appendChild(thread);

    this.animateDrop(thread);
  }

  setupInspect() {
    // Track cursor
    const trackCursor = (e) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
    };
    document.addEventListener('mousemove', trackCursor);

    // Start from random position
    const pos = randomEdgePosition();
    this.x = pos.x;
    this.y = pos.y;

    this.animateInspect();

    // Stop after random time
    setTimeout(() => {
      document.removeEventListener('mousemove', trackCursor);
      this.destroy();
    }, random(5000, 10000));
  }

  animateWalk() {
    if (this.fleeing) {
      this.animationFrame = requestAnimationFrame(() => this.animateWalk());
      return;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.destroy();
      return;
    }

    // Move toward target
    const angle = Math.atan2(dy, dx);
    this.x += Math.cos(angle) * this.speed;
    this.y += Math.sin(angle) * this.speed;

    // Rotate spider to face direction
    const rotation = (angle * 180 / Math.PI) + 90;
    this.element.style.transform = `rotate(${rotation}deg)`;
    
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';

    this.animationFrame = requestAnimationFrame(() => this.animateWalk());
  }

  animateDrop(thread) {
    const dropDuration = 2000;
    const startTime = Date.now();
    
    const drop = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / dropDuration, 1);
      
      this.y = -50 + (this.targetY + 50) * progress;
      thread.style.height = (this.y + 50) + 'px';
      
      this.element.style.top = this.y + 'px';
      this.element.style.left = this.x + 'px';

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(drop);
      } else {
        // Hang for a moment
        setTimeout(() => {
          // Climb back up
          this.animateClimbUp(thread);
        }, random(1000, 3000));
      }
    };
    
    drop();
  }

  animateClimbUp(thread) {
    const climbDuration = 1500;
    const startY = this.y;
    const startTime = Date.now();
    
    const climb = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / climbDuration, 1);
      
      this.y = startY - (startY + 50) * progress;
      thread.style.height = (this.y + 50) + 'px';
      
      this.element.style.top = this.y + 'px';

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(climb);
      } else {
        this.destroy();
      }
    };
    
    climb();
  }

  animateInspect() {
    const dist = distance(this.x, this.y, this.cursorX, this.cursorY);
    
    // Move toward cursor but maintain some distance
    if (dist > 150) {
      const angle = Math.atan2(this.cursorY - this.y, this.cursorX - this.x);
      this.x += Math.cos(angle) * this.speed;
      this.y += Math.sin(angle) * this.speed;
      
      const rotation = (angle * 180 / Math.PI) + 90;
      this.element.style.transform = `rotate(${rotation}deg)`;
    } else if (dist < 100) {
      // Too close, back away
      const angle = Math.atan2(this.cursorY - this.y, this.cursorX - this.x);
      this.x -= Math.cos(angle) * this.speed;
      this.y -= Math.sin(angle) * this.speed;
      
      const rotation = (angle * 180 / Math.PI) - 90;
      this.element.style.transform = `rotate(${rotation}deg)`;
    }
    
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';

    if (!this.fleeing) {
      this.animationFrame = requestAnimationFrame(() => this.animateInspect());
    }
  }

  flee() {
    if (this.fleeing) return;
    
    this.fleeing = true;
    this.speed = 8;
    
    // Run to nearest edge
    const edges = [
      { x: -100, y: this.y },
      { x: window.innerWidth + 100, y: this.y },
      { x: this.x, y: -100 },
      { x: this.x, y: window.innerHeight + 100 }
    ];
    
    const nearest = edges.reduce((closest, edge) => {
      const d = distance(this.x, this.y, edge.x, edge.y);
      return d < closest.dist ? { edge, dist: d } : closest;
    }, { dist: Infinity }).edge;
    
    this.targetX = nearest.x;
    this.targetY = nearest.y;

    cancelAnimationFrame(this.animationFrame);
    this.animateWalk();
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

export class SpiderManager {
  constructor(audioSystem, settings) {
    this.audioSystem = audioSystem;
    this.settings = settings;
    this.spiders = [];
    this.timers = [];
  }

  start() {
    this.scheduleSpider();
  }

  scheduleSpider() {
    const baseInterval = TIME.SPIDER_MIN + (1 - this.settings.spiderFrequency) * (TIME.SPIDER_MAX - TIME.SPIDER_MIN);
    const interval = baseInterval + random(-5000, 5000);
    
    const timer = setTimeout(() => {
      if (this.settings.enabled && this.settings.spiders) {
        this.spawnSpider();
      }
      this.scheduleSpider();
    }, interval);
    
    this.timers.push(timer);
  }

  spawnSpider() {
    // Rare: spawn multiple spiders
    const count = probability(0.1) ? randomInt(2, 5) : 1;
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const spider = new Spider(this.audioSystem);
        spider.create();
        this.spiders.push(spider);

        setTimeout(() => {
          const index = this.spiders.indexOf(spider);
          if (index > -1) {
            this.spiders.splice(index, 1);
          }
        }, 20000);
      }, i * 500);
    }
  }

  stop() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
    this.spiders.forEach(spider => spider.destroy());
    this.spiders = [];
  }

  updateSettings(settings) {
    this.settings = settings;
  }
}

function probability(chance) {
  return Math.random() < chance;
}
