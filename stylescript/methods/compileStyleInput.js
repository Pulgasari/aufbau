// methods/compileStyleInput.js

import {
  isArray, isFn, isObject, isString,
} from './../vendors.js';

import { StyleBuilder }      from './../classes/StyleBuilder.js';
import { resolveDeclaration } from './resolveDeclaration.js';

/**
 * Normalizes any style definition (Object, Array, CSS string, or Builder) into a
 * flat CSS string. An optional context (a controller) applies alias/token resolution.
 */
export function compileStyleInput (input, context) {
  // 1. tagged template or raw css string
  if (isString(input)) return input;

  // 2. chainable builder function
  if (isFn(input)) {
    const builder = new StyleBuilder(context);
    input(builder);
    return builder.toCSS();
  }

  // 3. flat array or object structure
  if (isArray(input) || isObject(input)) return parseObjectOrArray(input, '', context);

  return '';
}

// recursively flattens arrays and parses nested style objects, resolving each
// declaration through the shared resolver.
function parseObjectOrArray (styles, parentSelector = '', context) {
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

        const declarations = [];
        const nestedBlocks = [];

        const flatRules = Array.isArray(rules) ? rules.flat(Infinity) : [rules];

        for (const ruleItem of flatRules) {
          for (const [prop, value] of Object.entries(ruleItem)) {
            if (typeof value === 'object' && value !== null) {
              nestedBlocks.push({ [prop]: value });
            } else {
              const [cssProp, cssValue] = resolveDeclaration(prop, value, context);
              declarations.push(`  ${cssProp}: ${cssValue};`);
            }
          }
        }

        if (declarations.length > 0) {
          cssString += `${fullSelector} {\n${declarations.join('\n')}\n}\n`;
        }

        for (const nested of nestedBlocks) {
          cssString += parseObjectOrArray(nested, fullSelector, context);
        }
      }
    }
  }

  return cssString;
}

// tagged template helper
export function css (strings, ...values) {
  return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
}
