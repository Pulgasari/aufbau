// @aufbau/patterns/lib/stripes.js
import { patternTag, resolve } from '../core.js';

export const id   = 'stripes';
export const name = 'Stripes';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 20, min: 4, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 4, min: 1, max: 20, step: 1, bake: true, unit: 'px' },
};

export default function stripes (options = {}) {
  const v = resolve(vars, options);
  const s = v.size;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <line x1="0" y1="0" x2="0" y2="${s}" stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
