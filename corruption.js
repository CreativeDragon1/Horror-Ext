// Webpage corruption effects
import { random, randomInt, randomChoice, probability, createElement } from './shared/utils.js';
import { TIME } from './shared/constants.js';

export class CorruptionManager {
  constructor(settings) {
    this.settings = settings;
    this.timers = [];
    this.activeEffects = [];
  }

  start() {
    this.scheduleCorruption();
  }

  scheduleCorruption() {
    const baseInterval = TIME.CORRUPTION_MIN + (1 - this.settings.distortionFrequency) * (TIME.CORRUPTION_MAX - TIME.CORRUPTION_MIN);
    const interval = baseInterval + random(-2000, 2000);
    
    const timer = setTimeout(() => {
      if (this.settings.enabled && this.settings.corruption) {
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
    
    const effect = randomChoice(effects);
    effect();
  }

  textMutation() {
    // Find random text elements
    const textElements = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li'))
      .filter(el => el.textContent.trim().length > 0);
    
    if (textElements.length === 0) return;

    const count = randomInt(1, 5);
    for (let i = 0; i < count; i++) {
      const element = randomChoice(textElements);
      const originalTransform = element.style.transform;
      const originalFilter = element.style.filter;
      
      const mutations = [
        { transform: `scaleX(-1)`, filter: 'none' }, // Reverse
        { transform: `scaleY(1.5) scaleX(0.8)`, filter: 'none' }, // Stretch
        { transform: `skewX(${random(-20, 20)}deg)`, filter: 'none' }, // Skew
        { transform: `translateY(${random(5, 15)}px)`, filter: 'blur(2px)' } // Drip
      ];
      
      const mutation = randomChoice(mutations);
      
      element.style.transition = 'all 0.3s ease-out';
      element.style.transform = mutation.transform;
      element.style.filter = mutation.filter;
      
      setTimeout(() => {
        element.style.transform = originalTransform;
        element.style.filter = originalFilter;
      }, random(1000, 3000));
    }
  }

  layoutTilt() {
    const originalTransform = document.body.style.transform;
    const angle = random(-2, 2);
    
    document.body.style.transition = 'transform 0.5s ease-out';
    document.body.style.transform = `rotate(${angle}deg)`;
    
    setTimeout(() => {
      document.body.style.transform = originalTransform;
    }, random(2000, 4000));
  }

  cursorCorruption() {
    // Create custom cursor element
    const cursor = createElement('div', ['haunted-cursor-trail']);
    document.body.appendChild(cursor);
    
    let mouseX = 0, mouseY = 0;
    const trail = [];
    const trailLength = 10;
    
    const trackMouse = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    
    document.addEventListener('mousemove', trackMouse);
    
    const animate = () => {
      trail.push({ x: mouseX, y: mouseY });
      if (trail.length > trailLength) trail.shift();
      
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
      
      // Draw trail
      let trailHTML = '';
      trail.forEach((pos, i) => {
        const opacity = i / trailLength;
        const size = 10 + (i / trailLength) * 20;
        trailHTML += `<div style="position:absolute;left:${pos.x}px;top:${pos.y}px;width:${size}px;height:${size}px;background:rgba(255,0,0,${opacity * 0.3});border-radius:50%;pointer-events:none;"></div>`;
      });
      cursor.innerHTML = trailHTML;
    };
    
    const interval = setInterval(animate, 50);
    
    setTimeout(() => {
      clearInterval(interval);
      document.removeEventListener('mousemove', trackMouse);
      if (cursor.parentNode) cursor.parentNode.removeChild(cursor);
    }, random(3000, 6000));
  }

  colorShift() {
    const originalFilter = document.body.style.filter;
    
    document.body.style.transition = 'filter 0.5s ease-out';
    document.body.style.filter = 'hue-rotate(180deg) saturate(0.5) brightness(0.8)';
    
    setTimeout(() => {
      document.body.style.filter = originalFilter;
    }, random(1000, 3000));
  }

  linkSabotage() {
    const links = Array.from(document.querySelectorAll('a'));
    if (links.length === 0) return;

    const count = Math.min(randomInt(3, 10), links.length);
    const selectedLinks = [];
    
    for (let i = 0; i < count; i++) {
      selectedLinks.push(randomChoice(links));
    }

    selectedLinks.forEach(link => {
      const originalTransform = link.style.transform;
      
      const sabotage = (e) => {
        link.style.transition = 'transform 0.1s ease-out';
        link.style.transform = `translateX(${random(-10, 10)}px) translateY(${random(-10, 10)}px)`;
      };
      
      const reset = () => {
        link.style.transform = originalTransform;
      };
      
      link.addEventListener('mouseenter', sabotage);
      link.addEventListener('mouseleave', reset);
      
      setTimeout(() => {
        link.removeEventListener('mouseenter', sabotage);
        link.removeEventListener('mouseleave', reset);
        link.style.transform = originalTransform;
      }, random(5000, 10000));
    });
  }

  stop() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];
  }

  updateSettings(settings) {
    this.settings = settings;
  }
}
