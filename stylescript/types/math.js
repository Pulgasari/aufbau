// stylescript/types/math.js

import { CalcValue } from './base.js';

// css math function helpers. each returns an opaque CalcValue that serializes to
// the expression and composes inside style objects and template strings.
export const calc  = (expr)            => new CalcValue(`calc(${expr})`);
export const clamp = (min, val, max)   => new CalcValue(`clamp(${min}, ${val}, ${max})`);
export const max   = (...values)       => new CalcValue(`max(${values.join(', ')})`);
export const min   = (...values)       => new CalcValue(`min(${values.join(', ')})`);
