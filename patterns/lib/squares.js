// @aufbau/patterns/lib/squares.js
import { patternTag, resolve } from '../core.js';

export const id   = 'squares';
export const name = 'Squares';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 20, min: 4, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 2, min: 0.5, max: 12, step: 0.5, bake: true, unit: 'px' },
};

// an inset box; neighbouring boxes share the gap, so the field reads as a grid
// of separated squares
export default function squares (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const w = Number(v.width);
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <rect x="${w / 2}" y="${w / 2}" width="${s - w}" height="${s - w}"
          fill="none" stroke="${v.fg}" stroke-width="${w}"/>
  `, v.rotate, options);
}
