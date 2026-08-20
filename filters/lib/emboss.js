// @aufbau/filters/lib/emboss.js
import { filterTag, resolve } from '../core.js';

export const id   = 'emboss';
export const name = 'Emboss';
export const vars = {
  strength : { type: 'number', default: 1, min: 0.2, max: 3, step: 0.1, bake: true },
};

export default function emboss (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.strength);
  return filterTag(id, `
    <feConvolveMatrix order="3" preserveAlpha="true" divisor="1" bias="0.5"
      kernelMatrix="${(-2 * s).toFixed(2)} ${(-s).toFixed(2)} 0  ${(-s).toFixed(2)} 1 ${s.toFixed(2)}  0 ${s.toFixed(2)} ${(2 * s).toFixed(2)}"/>
  `, options);
}
