// @aufbau/filters/lib/halftone.js
import { dataUri, filterTag, resolve } from '../core.js';

export const id   = 'halftone';
export const name = 'Half Tone';
// grayscale, contrast-boosted, then multiplied by a tiled dot grid for a printed
// half-tone feel. a real half-tone varies dot size with tone, which svg filters
// cannot do; this is a fixed-grid stylisation. `size` sets the pitch and bakes.
export const vars = {
  size : { type: 'number', default: 5, min: 3, max: 20, step: 1, bake: true },
};

export default function halftone (options = {}) {
  const v    = resolve(vars, options);
  const s    = Number(v.size);
  const tile = dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
      <rect width="${s}" height="${s}" fill="#000000"/>
      <circle cx="${s / 2}" cy="${s / 2}" r="${(s * 0.45).toFixed(2)}" fill="#ffffff"/>
    </svg>
  `);
  return filterTag(id, `
    <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="gray"/>
    <feComponentTransfer in="gray" result="contrast">
      <feFuncR type="linear" slope="1.6" intercept="-0.3"/>
      <feFuncG type="linear" slope="1.6" intercept="-0.3"/>
      <feFuncB type="linear" slope="1.6" intercept="-0.3"/>
    </feComponentTransfer>
    <feImage href="${tile}" x="0" y="0" width="${s}" height="${s}" result="dot"/>
    <feTile in="dot" result="grid"/>
    <feComposite in="contrast" in2="grid" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
  `, options);
}
