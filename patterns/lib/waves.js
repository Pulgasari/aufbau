// @aufbau/patterns/lib/waves.js
import { patternTag, resolve } from '../core.js';

export const id   = 'waves';
export const name = 'Waves';
export const vars = {
  bg     : { type: 'color' , default: 'transparent' },
  fg     : { type: 'color' , default: '#000000' },
  rotate : { type: 'angle' , default: 0, min: 0, max: 360, step: 1, unit: 'deg', bake: true },
  size   : { type: 'number', default: 24, min: 6, max: 100, step: 1, bake: true },
  width  : { type: 'number', default: 2, min: 0.5, max: 12, step: 0.5, bake: true, unit: 'px' },
};

// a quadratic up-bump then its smooth (T) mirror down-bump — one full sine per
// tile, entering and leaving at the same mid-height so it repeats seamlessly
export default function waves (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.size);
  const h = s / 2;
  return patternTag(id, s, `
    <rect width="${s}" height="${s}" fill="${v.bg}"/>
    <path d="M0,${h} Q ${s * 0.25},0 ${h},${h} T ${s},${h}"
          fill="none" stroke="${v.fg}" stroke-width="${v.width}"/>
  `, v.rotate, options);
}
