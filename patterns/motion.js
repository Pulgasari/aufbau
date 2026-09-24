// @aufbau/patterns/motion.js
// scrolls a background tiling by one tile per cycle, so the loop is seamless.
// independent of the tile: static and self animating patterns drift the same.
//
//   const motion = new Motion('up-right', { size: 24, speed: '12s' });
//   motion.apply('.hero');
//   Motion.stop('.hero');
//
// keyframes, animation and css touch no dom and work in node.

import { toElements } from './core.js';

// unit vectors, positive y scrolls down, positive x right
export const DIRECTIONS = {
  'down'       : [ 0,  1],
  'down-left'  : [-1,  1],
  'down-right' : [ 1,  1],
  'left'       : [-1,  0],
  'right'      : [ 1,  0],
  'up'         : [ 0, -1],
  'up-left'    : [-1, -1],
  'up-right'   : [ 1, -1],
};

// one sheet for every keyframes rule, adopted into the document on first use
let sheet = null;
const inserted = new Set;

export class Motion {
  constructor (direction = 'down', { size = 20, speed = '8s', timing = 'linear' } = {}) {
    if (!DIRECTIONS[direction]) throw new Error(`[@aufbau/patterns] unknown motion "${direction}"`);
    Object.assign(this, { direction, size: Number(size) || 0, speed, timing });
  }

  get name      () { return `aufbau-pattern-${this.direction}-${String(this.size).replace(/\W/g, '_')}`; }
  get animation () { return `${this.name} ${this.speed} ${this.timing} infinite`; }

  get keyframes () {
    const [x, y] = DIRECTIONS[this.direction].map(unit => unit * this.size);
    return `@keyframes ${this.name} { to { background-position: ${x}px ${y}px; } }`;
  }

  /** keyframes plus the declaration, for a stylesheet */
  get css () { return `${this.keyframes}\nanimation: ${this.animation};`; }

  apply (target) {
    if (!inserted.has(this.name)) {
      if (!sheet) {
        sheet = new CSSStyleSheet;
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }
      sheet.insertRule(this.keyframes, sheet.cssRules.length);
      inserted.add(this.name);
    }

    for (const element of toElements(target)) {
      element.style.animation      = this.animation;
      element.dataset.aufbauMotion = this.direction;
    }
    return this;
  }

  static stop (target) {
    for (const element of toElements(target)) {
      if (!element.dataset.aufbauMotion) continue;
      element.style.removeProperty('animation');
      delete element.dataset.aufbauMotion;
    }
  }
}

export default Motion;
