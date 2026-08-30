// @aufbau/patterns/lib/diamonds.js
import { patternTag, resolve } from '../core.js';

export const id   = 'diamonds';
export const name = 'Diamonds';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 24, min: 4, max: 100, step: 1, bake: true },
};

// a diamond touching the four edge midpoints — its corners meet the neighbours'
// across every edge, so the whole field is one seamless diamond grid
export default function diamonds (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const h = s / 2;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M${h},0 L${s},${h} L${h},${s} L0,${h} Z" fill="${v.fg}"/>
  `, v.rotate, options);
}
