// @aufbau/patterns/lib/diagonal.js
import { patternTag, resolve } from '../core.js';

export const id   = 'diagonal';
export const name = 'Diagonal';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 20, min: 4, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 4, min: 1, max: 20, step: 1, bake: true, unit: 'px' },
};

// the three-segment path is the classic seamless 45° line: the main diagonal
// plus the two half-diagonals in the opposite corners, so the stroke joins
// continuously across every tile edge.
export default function diagonal (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M-1,1 L1,-1 M0,${s} L${s},0 M${s - 1},${s + 1} L${s + 1},${s - 1}"
          stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
