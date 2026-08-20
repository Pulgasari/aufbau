// @aufbau/filters/lib/contrast.js
import { filterTag, resolve } from '../core.js';

export const id   = 'contrast';
export const name = 'Contrast';
export const vars = {
  amount : { type: 'number', default: 1, min: 0, max: 3, step: 0.05 },
};

export default function contrast (options = {}) {
  const v = resolve(vars, options);
  const c = Number(options.amount ?? vars.amount.default);
  const i = ((1 - c) / 2).toFixed(3); // intercept keeps mid-grey fixed
  return filterTag(id, `
    <feComponentTransfer>
      <feFuncR type="linear" slope="${v.amount}" intercept="${i}"/>
      <feFuncG type="linear" slope="${v.amount}" intercept="${i}"/>
      <feFuncB type="linear" slope="${v.amount}" intercept="${i}"/>
    </feComponentTransfer>
  `, options);
}

export const css = (options = {}) => `contrast(${options.amount ?? vars.amount.default})`;
