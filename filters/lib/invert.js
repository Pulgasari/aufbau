// @aufbau/filters/lib/invert.js
import { filterTag, resolve } from '../core.js';

export const id   = 'invert';
export const name = 'Invert';
// invert(a): out = a·(1-in) + (1-a)·in = (1-2a)·in + a, i.e. linear slope/intercept.
export const vars = {
  amount : { type: 'number', default: 1, min: 0, max: 1, step: 0.05 },
};

export default function invert (options = {}) {
  const a = Number(options.amount ?? vars.amount.default);
  const slope = (1 - 2 * a).toFixed(3);
  return filterTag(id, `
    <feComponentTransfer>
      <feFuncR type="linear" slope="${slope}" intercept="${a}"/>
      <feFuncG type="linear" slope="${slope}" intercept="${a}"/>
      <feFuncB type="linear" slope="${slope}" intercept="${a}"/>
    </feComponentTransfer>
  `, options);
}

export const css = (options = {}) => `invert(${options.amount ?? vars.amount.default})`;
