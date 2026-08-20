// @aufbau/filters/lib/sepia.js
import { filterTag, resolve } from '../core.js';

export const id   = 'sepia';
export const name = 'Sepia';
// the standard sepia matrix, interpolated with identity by `amount` at build time.
export const vars = {
  amount : { type: 'number', default: 1, min: 0, max: 1, step: 0.05 },
};

// identity + a·(sepia - identity), per matrix cell.
function mix (identity, sepia, a) {
  return (identity + a * (sepia - identity)).toFixed(4);
}

export default function sepia (options = {}) {
  const a = Number(options.amount ?? vars.amount.default);
  const r = `${mix(1, 0.393, a)} ${mix(0, 0.769, a)} ${mix(0, 0.189, a)} 0 0`;
  const g = `${mix(0, 0.349, a)} ${mix(1, 0.686, a)} ${mix(0, 0.168, a)} 0 0`;
  const b = `${mix(0, 0.272, a)} ${mix(0, 0.534, a)} ${mix(1, 0.131, a)} 0 0`;
  return filterTag(id, `<feColorMatrix type="matrix" values="${r}  ${g}  ${b}  0 0 0 1 0"/>`, options);
}

export const css = (options = {}) => `sepia(${options.amount ?? vars.amount.default})`;
