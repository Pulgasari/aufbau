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
      if (typeof rules !== 'object' || rules === null) continue;

      // top-level at-rule (@media/@tablet/@supports …): its body is a selector map
      const topAtRule = !parentSelector && resolveAtRule(selector, context);
      if (topAtRule) {
        cssString += `${topAtRule} {\n${parseObjectOrArray(rules, '', context)}}\n`;
        continue;
      }

      const fullSelector = parentSelector
        ? selector.includes('&')
          ? selector.replace(/&/g, parentSelector)
          : `${parentSelector} ${selector}`
        : selector;

      const declarations = [];
      const nestedBlocks = [];
      const atBlocks     = [];

      const flatRules = Array.isArray(rules) ? rules.flat(Infinity) : [rules];

      for (const ruleItem of flatRules) {
        for (const [prop, value] of Object.entries(expandUse(ruleItem, context))) {
          if (typeof value === 'object' && value !== null) {
            const nestedAtRule = resolveAtRule(prop, context);
            if (nestedAtRule) atBlocks.push({ atRule: nestedAtRule, rules: value });
            else              nestedBlocks.push({ [prop]: value });
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

      // at-rule nested inside a selector: @media { fullSelector { … } }
      for (const { atRule, rules: atRules } of atBlocks) {
        cssString += `${atRule} {\n${parseObjectOrArray({ [fullSelector]: atRules }, '', context)}}\n`;
      }
    }
  }

  return cssString;
}

// resolves an at-rule key. a bare `@<breakpoint>` becomes @media (min-width: …)
// when the controller knows the breakpoint; any other `@…` key is passed through
// verbatim (@media (…), @supports (…), @container …). non-@ keys are not at-rules.
function resolveAtRule (key, context) {
  if (typeof key !== 'string' || key[0] !== '@') return null;

  const breakpoint = context?.breakpoint?.(key.slice(1));
  if (breakpoint) return `@media (min-width: ${breakpoint})`;

  return key;
}

// resolves a `use` key (trait name or array of names) by inlining the referenced
// declaration sets ahead of the object's own declarations, which win on conflict.
// without a controller context the `use` key is dropped.
function expandUse (ruleItem, context) {
  if (!ruleItem || ruleItem.use === undefined) return ruleItem;

  const { use, ...own } = ruleItem;
  if (!context?.resolveTrait) return own;

  const names  = Array.isArray(use) ? use : [use];
  const traits = names.map(name => context.resolveTrait(name));
  return Object.assign({}, ...traits, own);
}

// tagged template helper
export function css (strings, ...values) {
  return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
}
