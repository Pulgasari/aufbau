// @aufbau/filters/lib/brightness.js
import { filterTag, resolve } from '../core.js';

export const id   = 'brightness';
export const name = 'Brightness';
export const vars = {
  amount : { type: 'number', default: 1, min: 0, max: 3, step: 0.05 },
};

export default function brightness (options = {}) {
  const v = resolve(vars, options);
  return filterTag(id, `
    <feComponentTransfer>
      <feFuncR type="linear" slope="${v.amount}"/>
      <feFuncG type="linear" slope="${v.amount}"/>
      <feFuncB type="linear" slope="${v.amount}"/>
    </feComponentTransfer>
  `, options);
}

export const css = (options = {}) => `brightness(${options.amount ?? vars.amount.default})`;
