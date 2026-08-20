// @aufbau/filters/lib/posterize.js
import { filterTag, resolve } from '../core.js';

export const id   = 'posterize';
export const name = 'Posterize';
// tableValues is not a css property, so levels is baked into the transfer table.
export const vars = {
  levels : { type: 'integer', default: 4, min: 2, max: 12, step: 1, bake: true },
};

export default function posterize (options = {}) {
  const v = resolve(vars, options);
  const n = Math.max(2, Number(v.levels));
  const table = Array.from({ length: n }, (_, i) => (i / (n - 1)).toFixed(3)).join(' ');
  return filterTag(id, `
    <feComponentTransfer>
      <feFuncR type="discrete" tableValues="${table}"/>
      <feFuncG type="discrete" tableValues="${table}"/>
      <feFuncB type="discrete" tableValues="${table}"/>
    </feComponentTransfer>
  `, options);
}
