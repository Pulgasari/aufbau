// resolveValue.js

import { CssValue, Angle, Length, Time } from './types/index.js';

const VALUE_REGEX = /^(-?\d*(?:\.\d+)?)\s*([a-z%]*)$/i;

/**
 * Universal parser converting raw strings, numbers, or CssValues into typed instances.
 * 
 * @param {string|number|CssValue} input - Raw CSS value
 * @param {string} [defaultUnit='px'] - Fallback unit if number is provided
 * @returns {CssValue} Parsed unit-aware value instance
 */
export function resolveValue (input, defaultUnit = 'px') {
  // 1. Return as-is if already a CssValue instance
  if (input instanceof CssValue) {
    return input
  }

  // 2. Handle raw numbers
  if (typeof input === 'number') {
    return new Length(input, defaultUnit);
  }

  // 3. Parse string representations ("10px", "1.5rem", "45deg", "300ms", "50%")
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const match = trimmed.match(VALUE_REGEX);

    if (match && match[1] !== '') {
      const amount = parseFloat(match[1]);
      const unit = match[2].toLowerCase() || defaultUnit;

      // Map to specific type classes based on unit
      if (['deg', 'rad', 'turn', 'grad'].includes(unit)) {
        return Angle(amount, unit);
      }
      if (['ms', 's'].includes(unit)) {
        return Time(amount, unit);
      }
      // Fallback for lengths, percentages (%), and unitless numbers
      return Length(amount, unit);
    }
  }

  // Fallback for complex strings (e.g. calc expressions)
  return new CssValue(String(input));
}

/**
 * Polymorphic factory & type alias for generic values
 */
export const Num = Object.assign(
  (val, defaultUnit) => resolveValue(val, defaultUnit),
  {
    parse: resolveValue
  }
);
