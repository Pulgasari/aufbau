// @aufbau/stylesheet/skills/trait.js

import { blockEnd } from './parse.js';

/**
 * Extracts @aufbau-trait blocks and resolves aufbau-use declarations.
 */
export function transformTraits (code) {
  if (!code) return code;

  const traits = new Map();

  // 1. Parse @aufbau-trait blocks
  const traitRegex = /@aufbau-trait\s+(\.?[a-zA-Z0-9_-]+)\s*\{/g;
  let match;
  let cleanCode = code;

  while ((match = traitRegex.exec(code)) !== null) {
    const fullMatchStr = match[0];
    const rawTraitName = match[1];
    const startIdx = match.index;
    const i = blockEnd(code, match.index + fullMatchStr.length);

    const fullBlock   = code.slice(startIdx, i);
    const bodyContent = code.slice(startIdx + fullMatchStr.length, i - 1).trim();

    // Register trait with and without leading dot for flexible lookup
    traits.set(rawTraitName, bodyContent);
    if (rawTraitName.startsWith('.')) {
      traits.set(rawTraitName.slice(1), bodyContent);
    } else {
      traits.set(`.${rawTraitName}`, bodyContent);
    }

    // Keep traits starting with '.' as explicit CSS classes; omit phantom traits
    if (rawTraitName.startsWith('.')) {
      cleanCode = cleanCode.replace(fullBlock, `${rawTraitName} {\n  ${bodyContent}\n}`);
    } else {
      cleanCode = cleanCode.replace(fullBlock, '');
    }
  }

  // 2. Extract standard CSS classes using proper brace counting (supports nesting)
  const classMap = new Map();
  const classHeaderRegex = /(?:^|\s|\})\s*(\.[a-zA-Z0-9_-]+)\s*\{/g;
  let classMatch;

  while ((classMatch = classHeaderRegex.exec(cleanCode)) !== null) {
    const className = classMatch[1];
    const bodyStart = classMatch.index + classMatch[0].length;
    const i = blockEnd(cleanCode, bodyStart);

    const classBody = cleanCode.slice(bodyStart, i - 1).trim();

    if (!classMap.has(className)) {
      classMap.set(className,          classBody);
      classMap.set(className.slice(1), classBody);
    }
  }

  // 3. Resolve aufbau-use declarations (supports space and optional comma separation)
  const useRegex = /aufbau-use\s*:\s*([^;}\n]+);?/g;

  // Multi-pass loop to support nested trait references
  let passCount = 0;
  while (useRegex.test(cleanCode) && passCount < 5) {
    useRegex.lastIndex = 0;
    cleanCode = cleanCode.replace(useRegex, (fullMatch, rawValues) => {
      const names = rawValues.trim().split(/[\s,]+/).filter(Boolean);
      const expandedRules = [];

      for (const name of names) {
        if (traits.has(name)) {
          expandedRules.push(traits.get(name));
        } else if (classMap.has(name)) {
          expandedRules.push(classMap.get(name));
        }
      }

      return expandedRules.length > 0 ? expandedRules.join('\n  ') : '';
    });

    passCount++;
  }

  return cleanCode;
}

export default transformTraits;
