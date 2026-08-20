// @aufbau/filters/lib/tilt-shift.js
import { dataUri, filterTag, resolve } from '../core.js';

export const id   = 'tilt-shift';
export const name = 'Tilt Shift';
// keeps a sharp horizontal band and blurs above/below it, by masking a blurred copy
// with a vertical alpha gradient (feImage) and laying it over the sharp source.
// amount stays live (stdDeviation); the band width bakes into the mask.
export const vars = {
  amount : { type: 'number', default: 6, min: 0, max: 20, step: 0.5, unit: 'px' },
  band   : { type: 'number', default: 0.3, min: 0.05, max: 0.9, step: 0.05, bake: true },
};

export default function tiltShift (options = {}) {
  const v    = resolve(vars, options);
  const b    = Number(v.band);
  const top  = (0.5 - b / 2).toFixed(3);
  const bot  = (0.5 + b / 2).toFixed(3);
  const mask = dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="1"/>
        <stop offset="${top}" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="${bot}" stop-color="#ffffff" stop-opacity="0"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="1"/>
      </linearGradient>
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
