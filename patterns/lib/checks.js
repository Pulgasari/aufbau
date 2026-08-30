// @aufbau/patterns/lib/checks.js
import { patternTag, resolve } from '../core.js';

export const id   = 'checks';
export const name = 'Checkerboard';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 20, min: 4, max: 100, step: 1, bake: true },
};

export default function checks (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const h = s / 2;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <rect width="${h}" height="${h}" fill="${v.fg}"/>
    <rect x="${h}" y="${h}" width="${h}" height="${h}" fill="${v.fg}"/>
  `, v.rotate, options);
}
