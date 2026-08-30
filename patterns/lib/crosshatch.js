// @aufbau/patterns/lib/crosshatch.js
import { patternTag, resolve } from '../core.js';

export const id   = 'crosshatch';
export const name = 'Crosshatch';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 20, min: 4, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 1, min: 0.5, max: 8, step: 0.5, bake: true, unit: 'px' },
};

// both diagonals, each as the seamless three-segment corner path (see diagonal.js)
export default function crosshatch (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M-1,1 L1,-1 M0,${s} L${s},0 M${s - 1},${s + 1} L${s + 1},${s - 1}
             M-1,${s - 1} L1,${s + 1} M0,0 L${s},${s} M${s - 1},-1 L${s + 1},1"
          fill="none" stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
