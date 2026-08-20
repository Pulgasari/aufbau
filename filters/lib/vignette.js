// @aufbau/filters/lib/vignette.js
import { dataUri, filterTag, resolve } from '../core.js';

export const id   = 'vignette';
export const name = 'Vignette';
// multiplies the source by a radial mask (white core -> grey edge) rendered through
// feImage, since svg filter primitives cannot express a radial falloff on their own.
// amount = edge darkness, size = radius of the untouched core. both bake into the mask.
export const vars = {
  amount : { type: 'number', default: 0.6, min: 0, max: 1, step: 0.05, bake: true },
  size   : { type: 'number', default: 0.5, min: 0, max: 1, step: 0.05, bake: true },
};

export default function vignette (options = {}) {
  const v    = resolve(vars, options);
  const edge = Math.round((1 - Number(v.amount)) * 255).toString(16).padStart(2, '0');
  const mask = dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <radialGradient id="g" cx="50%" cy="50%" r="75%">
        <stop offset="${v.size}" stop-color="#ffffff"/>
        <stop offset="1" stop-color="#${edge}${edge}${edge}"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#g)"/>
    </svg>
  `);
  return filterTag(id, `
    <feImage href="${mask}" preserveAspectRatio="none" result="mask"/>
    <feComposite in="SourceGraphic" in2="mask" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
  `, options);
}
