// @aufbau/filters/lib/thermal.js
import { filterTag, resolve } from '../core.js';

export const id   = 'thermal';
export const name = 'Thermal';
// maps luminance onto a thermal-camera palette (cold blues -> hot reds/whites) with a
// per-channel transfer table. no options — the palette is the effect.
export const vars = {};

export default function thermal (options = {}) {
  resolve(vars, options);
  return filterTag(id, `
    <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0 0 0.35 0.9 1 1"/>
      <feFuncG type="table" tableValues="0 0.1 0.35 0.6 0.9 1"/>
      <feFuncB type="table" tableValues="0.25 0.6 0.45 0.1 0.2 1"/>
    </feComponentTransfer>
  `, options);
}
