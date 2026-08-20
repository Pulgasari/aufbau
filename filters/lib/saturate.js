// @aufbau/filters/lib/saturate.js
import { filterTag, resolve } from '../core.js';

export const id   = 'saturate';
export const name = 'Saturate';
export const vars = {
  amount : { type: 'number', default: 1.5, min: 0, max: 4, step: 0.05 },
};

export default function saturate (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `<feColorMatrix type="saturate" values="${v.amount}"/>`, options);
}

export const css = (options = {}) => `saturate(${options.amount ?? vars.amount.default})`;
