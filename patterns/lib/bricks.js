// @aufbau/patterns/lib/bricks.js
import { patternTag, resolve } from '../core.js';

export const id   = 'bricks';
export const name = 'Bricks';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 24, min: 6, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 1, min: 0.5, max: 8, step: 0.5, bake: true, unit: 'px' },
};

// running bond: two courses per tile, the head joints offset by half a brick.
// the horizontals tile top-to-bottom, the verticals sit at x=0 (top course) and
// x=size/2 (bottom course), so the offset repeats seamlessly.
export default function bricks (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const h = s / 2;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M0,0 H${s} M0,${h} H${s} M0,0 V${h} M${h},${h} V${s}"
          fill="none" stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
