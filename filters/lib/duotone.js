// @aufbau/filters/lib/duotone.js
import { filterTag, resolve } from '../core.js';

export const id   = 'duotone';
export const name = 'DuoTone';
// maps luminance onto a two-colour ramp: shadows -> `shadow`, highlights -> `highlight`.
// the colours are parsed to channel ramps at build time, so both are baked.
export const vars = {
  shadow    : { type: 'color', default: '#1a1a2e', bake: true },
  highlight : { type: 'color', default: '#e94560', bake: true },
};

// #rrggbb -> [r, g, b] in 0..1. falls back to black on anything unparseable.
function channels (hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

export default function duotone (options = {}) {
  const v = resolve(vars, options);
  const s = channels(v.shadow);
  const h = channels(v.highlight);
  return filterTag(id, `
    <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="${s[0]} ${h[0]}"/>
      <feFuncG type="table" tableValues="${s[1]} ${h[1]}"/>
      <feFuncB type="table" tableValues="${s[2]} ${h[2]}"/>
    </feComponentTransfer>
  `, options);
}
