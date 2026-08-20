// @aufbau/filters/lib/grayscale.js
import { filterTag, resolve } from '../core.js';

export const id   = 'grayscale';
export const name = 'Grayscale';
// grayscale(a) == desaturate to (1 - a); saturate takes the remaining saturation.
export const vars = {
  amount : { type: 'number', default: 1, min: 0, max: 1, step: 0.05 },
};

export default function grayscale (options = {}) {
  const a = Number(options.amount ?? vars.amount.default);
  return filterTag(id, `<feColorMatrix type="saturate" values="${(1 - a).toFixed(3)}"/>`, options);
}

export const css = (options = {}) => `grayscale(${options.amount ?? vars.amount.default})`;
