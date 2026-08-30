// @aufbau/patterns/lib/rings.js
import { patternTag, resolve } from '../core.js';

export const id   = 'rings';
export const name = 'Rings';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 24, min: 6, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 2, min: 0.5, max: 12, step: 0.5, bake: true, unit: 'px' },
};

export default function rings (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const r = s / 2 - Number(v.width);
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <circle cx="${s / 2}" cy="${s / 2}" r="${r}" fill="none" stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
