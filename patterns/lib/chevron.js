// @aufbau/patterns/lib/chevron.js
import { patternTag, resolve } from '../core.js';

export const id   = 'chevron';
export const name = 'Chevron';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 24, min: 4, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 4, min: 1, max: 20, step: 1, bake: true, unit: 'px' },
};

// a V near the top edge and its mirror near the bottom; the two meet at the tile
// edges so the zig-zag runs unbroken from one tile into the next
export default function chevron (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const h = s / 2;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M0,0 L${h},${h} L${s},0 M0,${s} L${h},${h} L${s},${s}"
          fill="none" stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
