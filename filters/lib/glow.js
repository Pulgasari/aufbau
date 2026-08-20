// @aufbau/filters/lib/glow.js
import { filterTag, resolve } from '../core.js';

export const id   = 'glow';
export const name = 'Glow';
export const vars = {
  amount   : { type: 'number', default: 4, min: 0, max: 20, step: 0.5, unit: 'px' },
  strength : { type: 'number', default: 1.4, min: 0, max: 4, step: 0.1, bake: true },
};

// blooms the source: a blurred, brightened copy merged under the original.
export default function glow (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feGaussianBlur stdDeviation="${v.amount}" result="blur"/>
    <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${v.strength} 0" result="glow"/>
    <feMerge>
      <feMergeNode in="glow"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  `, options);
}
