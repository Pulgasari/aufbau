// @aufbau/patterns/lib/crosses.js
import { patternTag, resolve } from '../core.js';

export const id   = 'crosses';
export const name = 'Crosses';
export const vars = {
  bg        : { type: 'color' , default: 'transparent' },
  fg        : { type: 'color' , default: '#000000' },
  rotate    : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size      : { type: 'number', default: 24, min: 6, max: 100, step: 1, bake: true },
  thickness : { type: 'number', default: 4, min: 1, max: 20, step: 1, bake: true, unit: 'px' },
};

export default function crosses (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const t = Number(v.thickness);
  const arm = s * 0.6;                 // the plus spans 60% of the tile, centred
  const off = (s - arm) / 2;
  const mid = (s - t) / 2;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <rect x="${mid}" y="${off}" width="${t}" height="${arm}" fill="${v.fg}"/>
    <rect x="${off}" y="${mid}" width="${arm}" height="${t}" fill="${v.fg}"/>
  `, v.rotate, options);
}
