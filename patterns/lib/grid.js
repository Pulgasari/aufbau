// @aufbau/patterns/lib/grid.js
import { patternTag, resolve } from '../core.js';

export const id   = 'grid';
export const name = 'Grid';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 20, min: 4, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 1, min: 0.5, max: 8, step: 0.5, bake: true, unit: 'px' },
};

export default function grid (options = {}) {
  const v = resolve(vars, options);
  const s = v.size;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M ${s} 0 L 0 0 0 ${s}" fill="none" stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
