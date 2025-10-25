// Environmental horror effects (fog, shadows, glitches, blood, etc.)
import { random, randomInt, randomChoice, probability, createElement } from './shared/utils.js';

export class EnvironmentManager {
  constructor(settings) {
    this.settings = settings;
    this.fogCanvas = null;
    this.fogCtx = null;
    this.fogParticles = [];
    this.fogAnimationFrame = null;
    this.effectTimers = [];
  }

  start() {
    if (this.settings.fog) this.startFog();
    if (this.settings.shadows) this.scheduleShadows();
    if (this.settings.glitches) this.scheduleGlitches();
    if (this.settings.blood) this.scheduleBlood();
  }

  // Fog effect using canvas
  startFog() {
    this.fogCanvas = createElement('canvas', ['haunted-fog']);
    this.fogCanvas.width = window.innerWidth;
    this.fogCanvas.height = window.innerHeight;
    this.fogCtx = this.fogCanvas.getContext('2d');
    document.body.appendChild(this.fogCanvas);

    // Create fog particles
    for (let i = 0; i < 50; i++) {
      this.fogParticles.push({
        x: random(0, window.innerWidth),
        y: random(0, window.innerHeight),
        size: random(100, 300),
        speedX: random(-0.5, 0.5),
        speedY: random(-0.3, 0.3),
        opacity: random(0.05, 0.15)
      });
    }

    this.animateFog();

    // Handle window resize
    window.addEventListener('resize', () => {
      if (this.fogCanvas) {
        this.fogCanvas.width = window.innerWidth;
        this.fogCanvas.height = window.innerHeight;
      }
    });
  }

  animateFog() {
    if (!this.fogCtx) return;

    this.fogCtx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

    this.fogParticles.forEach(particle => {
      // Move particle
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Wrap around screen
      if (particle.x < -particle.size) particle.x = this.fogCanvas.width + particle.size;
      if (particle.x > this.fogCanvas.width + particle.size) particle.x = -particle.size;
      if (particle.y < -particle.size) particle.y = this.fogCanvas.height + particle.size;
      if (particle.y > this.fogCanvas.height + particle.size) particle.y = -particle.size;

      // Draw particle
      const gradient = this.fogCtx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      gradient.addColorStop(0, `rgba(200, 200, 220, ${particle.opacity})`);
      gradient.addColorStop(1, 'rgba(200, 200, 220, 0)');

      this.fogCtx.fillStyle = gradient;
      this.fogCtx.fillRect(
        particle.x - particle.size,
        particle.y - particle.size,
        particle.size * 2,
        particle.size * 2
      );
    });

    this.fogAnimationFrame = requestAnimationFrame(() => this.animateFog());
  }

  stopFog() {
    if (this.fogAnimationFrame) {
      cancelAnimationFrame(this.fogAnimationFrame);
      this.fogAnimationFrame = null;
    }
    if (this.fogCanvas && this.fogCanvas.parentNode) {
      this.fogCanvas.parentNode.removeChild(this.fogCanvas);
      this.fogCanvas = null;
      this.fogCtx = null;
    }
    this.fogParticles = [];
  }

  // Crawling shadows
  scheduleShadows() {
    const spawnShadow = () => {
      if (!this.settings.enabled || !this.settings.shadows) return;

      const shadow = createElement('div', ['haunted-shadow']);
      const edge = randomChoice(['top', 'right', 'bottom', 'left']);
      shadow.classList.add(`shadow-${edge}`);
      
      document.body.appendChild(shadow);

      setTimeout(() => {
        if (shadow.parentNode) shadow.parentNode.removeChild(shadow);
      }, 5000);
    };

    const schedule = () => {
      spawnShadow();
      const timer = setTimeout(schedule, random(10000, 30000));
      this.effectTimers.push(timer);
    };

    schedule();
  }

  // Glitch effects
  scheduleGlitches() {
    const glitch = () => {
      if (!this.settings.enabled || !this.settings.glitches) return;

      const overlay = createElement('div', ['haunted-glitch']);
      document.body.appendChild(overlay);

      // Randomize glitch type
      const glitchType = randomChoice(['rgb-split', 'static', 'tear']);
      overlay.classList.add(`glitch-${glitchType}`);

      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, random(100, 400));
    };

    const schedule = () => {
      glitch();
      const timer = setTimeout(schedule, random(15000, 45000));
      this.effectTimers.push(timer);
    };

    schedule();
  }

  // Blood drips
  scheduleBlood() {
    const bloodDrip = () => {
      if (!this.settings.enabled || !this.settings.blood) return;

      const drip = createElement('div', ['haunted-blood-drip']);
      drip.style.left = random(0, window.innerWidth) + 'px';
      drip.style.animationDuration = random(2, 4) + 's';
      
      document.body.appendChild(drip);

      setTimeout(() => {
        if (drip.parentNode) drip.parentNode.removeChild(drip);
      }, 5000);
    };

    const schedule = () => {
      // Spawn multiple drips
      const count = randomInt(1, 3);
      for (let i = 0; i < count; i++) {
        setTimeout(() => bloodDrip(), i * 500);
      }
      const timer = setTimeout(schedule, random(20000, 60000));
      this.effectTimers.push(timer);
    };

    schedule();
  }

  // Shadow hands
  spawnShadowHands() {
    const hand1 = createElement('div', ['haunted-shadow-hand', 'hand-left']);
    const hand2 = createElement('div', ['haunted-shadow-hand', 'hand-right']);
    
    document.body.appendChild(hand1);
    document.body.appendChild(hand2);

    setTimeout(() => {
      if (hand1.parentNode) hand1.parentNode.removeChild(hand1);
      if (hand2.parentNode) hand2.parentNode.removeChild(hand2);
    }, 3000);
  }

  // Page flicker with silhouettes
  pageFlicker() {
    const overlay = createElement('div', ['haunted-flicker-overlay']);
    
    // Create random silhouettes
    for (let i = 0; i < randomInt(1, 3); i++) {
      const silhouette = createElement('div', ['haunted-silhouette']);
      silhouette.style.left = random(10, 80) + '%';
      silhouette.style.top = random(20, 60) + '%';
      silhouette.style.width = random(100, 200) + 'px';
      silhouette.style.height = random(150, 300) + 'px';
      overlay.appendChild(silhouette);
    }
    
    document.body.appendChild(overlay);

    // Flicker sequence
    const flicker = [100, 300, 100, 400, 100];
    let totalTime = 0;
    
    flicker.forEach((duration, index) => {
      setTimeout(() => {
        overlay.style.opacity = index % 2 === 0 ? '1' : '0';
      }, totalTime);
      totalTime += duration;
    });

    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, totalTime);
  }

  stop() {
    this.stopFog();
    this.effectTimers.forEach(timer => clearTimeout(timer));
    this.effectTimers = [];
  }

  updateSettings(settings) {
    this.settings = settings;
    
    // Restart fog if setting changed
    if (settings.fog && !this.fogCanvas) {
      this.startFog();
    } else if (!settings.fog && this.fogCanvas) {
      this.stopFog();
    }
  }
}
