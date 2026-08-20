// @aufbau/filters/lib/blur.js
import { filterTag, resolve } from '../core.js';

export const id   = 'blur';
export const name = 'Blur';
export const vars = {
  amount : { type: 'number', default: 2, min: 0, max: 20, step: 0.5, unit: 'px' },
};

export default function blur (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `<feGaussianBlur stdDeviation="${v.amount}"/>`, options);
}

// css backend: native blur() function.
export const css = (options = {}) => `blur(${options.amount ?? vars.amount.default}px)`;
