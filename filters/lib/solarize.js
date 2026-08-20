// @aufbau/filters/lib/solarize.js
import { filterTag, resolve } from '../core.js';

export const id   = 'solarize';
export const name = 'Solarize';
// intensity blends the identity ramp toward a fold (0→1→0) transfer curve, which
// inverts the highlights for the classic solarisation look. baked into tableValues.
export const vars = {
  intensity : { type: 'number', default: 1, min: 0, max: 1, step: 0.05, bake: true },
};

export default function solarize (options = {}) {
  const v         = resolve(vars, options);
  const t         = Number(v.intensity);
  const identity  = [0, 0.5, 1];
  const fold      = [0, 1, 0];
  const table     = identity.map((iv, i) => ((1 - t) * iv + t * fold[i]).toFixed(3)).join(' ');
  return filterTag(id, `
    <feComponentTransfer>
      <feFuncR type="table" tableValues="${table}"/>
      <feFuncG type="table" tableValues="${table}"/>
      <feFuncB type="table" tableValues="${table}"/>
    </feComponentTransfer>
  `, options);
}
