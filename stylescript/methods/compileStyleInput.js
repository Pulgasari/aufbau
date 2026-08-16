// stylescript/index.js

import {
  adoptStylesheet,
  createStylesheet,
  isArray, isFn, isObject, isString,
} from './../vendors.js';

import { RuleBuilder }  from './../classes/RuleBuilder.js';
import { StyleBuilder } from './../classes/StyleBuilder.js';

/**
 * Normalizes any style definition (Object, Array, CSS string, or Builder) into a flat CSS string.
 * @param {Object|Array|string|Function} input - Raw style inputs
 * @returns {string} Compiled CSS
 */
export function compileStyleInput (input) {
  // 1. Tagged template or raw CSS string
  if (isString(input)) return input;

  // 2. Chainable Builder function
  if (isFn(input)) {
    const builder = new StyleBuilder;
    input(builder);
    return builder.toCSS();
  }

  // 3. Flat Array or Object structure
  if (isArray(input) || isObject(input)) {
    return parseObjectOrArray(input);
  }

  return '';
}

/**
 * Helper to recursively flatten arrays and parse nested style objects.
 */
function parseObjectOrArray (styles, parentSelector = '') {
  const flatStyles = Array.isArray(styles) ? styles.flat(Infinity) : [styles];
  let cssString = '';

  for (const block of flatStyles) {
    if (typeof block === 'string') {
      cssString += block + '\n';
      continue;
    }

    for (const [selector, rules] of Object.entries(block)) {
      if (typeof rules === 'object' && rules !== null) {
        const fullSelector = parentSelector 
          ? selector.includes('&') 
            ? selector.replace(/&/g, parentSelector)
            : `${parentSelector} ${selector}`
          : selector;

        // Process nested properties vs inner selectors
        const declarations = [];
        const nestedBlocks = [];

        const flatRules = Array.isArray(rules) ? rules.flat(Infinity) : [rules];
        
        for (const ruleItem of flatRules) {
          for (const [prop, val] of Object.entries(ruleItem)) {
            if (typeof val === 'object' && val !== null) {
              nestedBlocks.push({ [prop]: val });
            } else {
              const cssProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
              declarations.push(`  ${cssProp}: ${val};`);
            }
          }
        }

        if (declarations.length > 0) {
          cssString += `${fullSelector} {\n${declarations.join('\n')}\n}\n`;
        }

        for (const nested of nestedBlocks) {
          cssString += parseObjectOrArray(nested, fullSelector);
        }
      }
    }
  }

  return cssString;
}







// Tagged template helper
export function css (strings, ...values) {
  return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
}
