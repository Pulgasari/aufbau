// @aufbau/filters/lib/rainbow.js
import { anim, filterTag, resolve } from '../core.js';

export const id   = 'rainbow';
export const name = 'Rainbow';
// cycles the hue through the full wheel. with { animate: false } it rests at the
// source hue (identity) — set it live and drive --aufbau-filter-hue for a static tint.
export const vars = {
  animate : { type: 'boolean', default: true },
  speed   : { type: 'time', default: '3s', bake: true },
};

export default function rainbow (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feColorMatrix type="hueRotate" values="0">
      ${anim(options, { attributeName: 'values', values: '0; 360', dur: v.speed })}
    </feColorMatrix>
  `, options);
}
