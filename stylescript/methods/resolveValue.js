// resolveValue.js

import { Angle, CalcValue, CssValue, Length, Time } from './../types/index.js';

const VALUE_REGEX = /^(-?\d*(?:\.\d+)?)\s*([a-z%]*)$/i;

/**
 * Parses a raw string, number or CssValue into the most specific typed instance,
 * dispatching Length / Angle / Time by unit. Non-numeric strings (calc(), var(), …)
 * become an opaque CalcValue.
 */
export function resolveValue (input, defaultUnit = 'px') {
  if (input instanceof CssValue) return input;
  if (typeof input === 'number')  return Length(input, defaultUnit);

  if (typeof input === 'string') {
    const match = input.trim().match(VALUE_REGEX);

    if (match && match[1] !== '') {
      const amount = parseFloat(match[1]);
      const unit   = match[2].toLowerCase() || defaultUnit;

      if (['deg', 'grad', 'rad', 'turn'].includes(unit)) return Angle(amount, unit);
      if (['ms', 's'].includes(unit))                    return Time(amount, unit);
      return Length(amount, unit);
    }
  }

  return new CalcValue(String(input));
}

export default resolveValue;
