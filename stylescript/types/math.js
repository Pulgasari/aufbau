// stylescript/types/math.js
import { CssValue } from './base.js';

// Calc and CSS Math Function Helpers
export const calc = (expr) => new CssValue(`calc(${expr})`);

export const clamp = (min, val, max) => {
  return new CssValue(`clamp(${min}, ${val}, ${max})`);
};

export const min = (...values) => {
  return new CssValue(`min(${values.join(', ')})`);
};

export const max = (...values) => {
  return new CssValue(`max(${values.join(', ')})`);
};
