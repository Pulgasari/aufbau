// @aufbau/patterns/lib/triangles.js
import { patternTag, resolve } from '../core.js';

export const id   = 'triangles';
export const name = 'Triangles';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 24, min: 4, max: 100, step: 1, bake: true },
};

export default function triangles (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M0,${s} L${s / 2},0 L${s},${s} Z" fill="${v.fg}"/>
  `, v.rotate, options);
}
