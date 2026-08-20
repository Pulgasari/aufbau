// @aufbau/filters/lib/barrel-blur.js
import { dataUri, filterTag, resolve } from '../core.js';

export const id   = 'barrel-blur';
export const name = 'Barrel Blur';
// approximation of a lens/zoom blur: sharp core, increasingly blurred toward the
// edges, via a radial alpha mask over a blurred copy. a true radial blur is not
// expressible with svg filter primitives, so this trades the streaking for a falloff.
export const vars = {
  amount : { type: 'number', default: 8, min: 0, max: 20, step: 0.5, unit: 'px' },
  size   : { type: 'number', default: 0.4, min: 0, max: 1, step: 0.05, bake: true },
};

export default function barrelBlur (options = {}) {
  const v    = resolve(vars, options);
  const mask = dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <radialGradient id="m" cx="50%" cy="50%" r="75%">
        <stop offset="${v.size}" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="1"/>
      </radialGradient>
      <rect width="100" height="100" fill="url(#m)"/>
    </svg>
  `);
  return filterTag(id, `
    <feGaussianBlur in="SourceGraphic" stdDeviation="${v.amount}" result="blur"/>
    <feImage href="${mask}" preserveAspectRatio="none" result="mask"/>
    <feComposite in="blur" in2="mask" operator="in" result="edge-blur"/>
    <feMerge>
      <feMergeNode in="SourceGraphic"/>
      <feMergeNode in="edge-blur"/>
    </feMerge>
  `, options);
}
