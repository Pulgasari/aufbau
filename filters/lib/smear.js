// @aufbau/filters/lib/smear.js
import { filterTag, resolve } from '../core.js';

export const id   = 'smear';
export const name = 'Smear';
// axis-aligned directional blur via a two-axis stdDeviation. x smears horizontally,
// y vertically; both stay live so a stylesheet can drive them.
export const vars = {
  x : { type: 'number', default: 8, min: 0, max: 40, step: 1, unit: 'px' },
  y : { type: 'number', default: 0, min: 0, max: 40, step: 1, unit: 'px' },
};

export default function smear (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `<feGaussianBlur stdDeviation="${v.x} ${v.y}"/>`, options);
}
