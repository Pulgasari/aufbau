// @aufbau/filters/lib/linocut.js
import { filterTag, resolve } from '../core.js';

export const id   = 'linocut';
export const name = 'Linocut';
// grayscale reduced to a few hard tone steps for a stark, carved black-and-white
// print look. a stylisation, not a true engraving. levels bakes into the transfer.
export const vars = {
  levels : { type: 'integer', default: 2, min: 2, max: 4, step: 1, bake: true },
};

export default function linocut (options = {}) {
  const v     = resolve(vars, options);
  const n     = Math.max(2, Number(v.levels));
  const table = Array.from({ length: n }, (_, i) => (i / (n - 1)).toFixed(3)).join(' ');
  return filterTag(id, `
    <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="discrete" tableValues="${table}"/>
      <feFuncG type="discrete" tableValues="${table}"/>
      <feFuncB type="discrete" tableValues="${table}"/>
    </feComponentTransfer>
  `, options);
}
