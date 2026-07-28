// @aufbau/stylesheet/skills/pattern.js

import * as patterns from '@aufbau/patterns';

/**
 * Transforms aufbau-pattern declarations into SVG background images and CSS animations.
 */
export function transformPattern (rawVal, tokens = {}) {
  if (!rawVal) return '';

  // 1. Extract rotate(...)
  let rotate = 0;
  const rotateMatch = rawVal.match(/rotate\s*\(\s*(-?\d+)(?:deg)?\s*\)/i);
  if (rotateMatch) {
    rotate = parseInt(rotateMatch[1], 10);
  }

  // 2. Extract colors(...)
  let bg = 'transparent';
  let fg = 'currentColor';
  const colorsMatch = rawVal.match(/colors\s*\(\s*([^)]+)\s*\)/i);

  if (colorsMatch) {
    const colorArgs = colorsMatch[1].trim().split(/\s+/);

    if (colorArgs.length === 1) {
      // Check for token pair reference (e.g., colors(dark))
      const tokenPair = tokens.colors?.[colorArgs[0]];
      if (tokenPair) {
        bg = tokenPair.bg;
        fg = tokenPair.fg;
      } else {
        fg = colorArgs[0];
      }
    } else if (colorArgs.length >= 2) {
      bg = colorArgs[0];
      fg = colorArgs[1];
    }
  }

  // 3. Extract animate(...)
  let animationRule = '';
  const animMatch = rawVal.match(/animate\s*\(\s*([^)]+)\s*\)/i);

  if (animMatch) {
    const animArgs = animMatch[1].trim().split(/\s+/);
    const animName = animArgs[0];
    const animRest = animArgs.slice(1).join(' ') || '3s linear infinite';
    const keyframeName = animName.startsWith('aufbau-') ? animName : `aufbau-pattern-${animName}`;

    animationRule = ` animation: ${keyframeName} ${animRest};`;
  }

  // 4. Extract pattern name by stripping function syntax
  const cleanedName = rawVal
    .replace(/rotate\s*\([^)]*\)/gi, '')
    .replace(/colors\s*\([^)]*\)/gi, '')
    .replace(/animate\s*\([^)]*\)/gi, '')
    .trim();

  const patternName = cleanedName.split(/\s+/)[0];
  const generator = patterns[patternName];

  if (!generator) {
    return `/* Unknown pattern: ${patternName} */`;
  }

  const svgDataUri = generator({ bg, fg, rotate });
  return `background-image: url('${svgDataUri}'); background-repeat: repeat;${animationRule}`;
}

export default transformPattern;
