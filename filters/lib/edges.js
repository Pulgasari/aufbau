// @aufbau/filters/lib/edges.js
import { filterTag, resolve } from '../core.js';

export const id   = 'edges';
export const name = 'Edges';
// laplacian edge detection. strength scales the kernel's centre/neighbour weights;
// kernelMatrix is not a css property, so it bakes.
export const vars = {
  strength : { type: 'number', default: 1, min: 0.2, max: 3, step: 0.1, bake: true },
};

export default function edges (options = {}) {
  const v = resolve(vars, options);
  const s = Number(v.strength);
  const k = (-s).toFixed(2);
  const c = (4 * s).toFixed(2);
  return filterTag(id, `
    <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 ${k} 0  ${k} ${c} ${k}  0 ${k} 0"/>
  `, options);
}
