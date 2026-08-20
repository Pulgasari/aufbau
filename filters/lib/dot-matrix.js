// @aufbau/filters/lib/dot-matrix.js
import { dataUri, filterTag, resolve } from '../core.js';

export const id   = 'dot-matrix';
export const name = 'Dot Matrix';
// multiplies the source by a tiled grid of round dots (bright dot, dark gap) for an
// led-panel look. `size` sets the dot pitch and bakes into the tile. this is a fixed
// grid, not a tone-varying halftone screen (not expressible with svg filters).
export const vars = {
  size : { type: 'number', default: 6, min: 3, max: 24, step: 1, bake: true },
};

export default function dotMatrix (options = {}) {
  const v    = resolve(vars, options);
  const s    = Number(v.size);
  const tile = dataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
      <rect width="${s}" height="${s}" fill="#000000"/>
      <circle cx="${s / 2}" cy="${s / 2}" r="${(s * 0.42).toFixed(2)}" fill="#ffffff"/>
    </svg>
  `);
  return filterTag(id, `
    <feImage href="${tile}" x="0" y="0" width="${s}" height="${s}" result="dot"/>
    <feTile in="dot" result="grid"/>
    <feComposite in="SourceGraphic" in2="grid" operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>
  `, options);
}
