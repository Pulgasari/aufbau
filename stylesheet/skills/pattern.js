// @aufbau/stylesheet/skills/pattern.js

import { encodeSvg } from '@aufbau/js';

// fallbacks mirror the var() defaults baked into svg/patterns/*.svg. kept here so
// a token omitted in the ass source still resolves without touching the svg.
const FALLBACKS = { bg: 'transparent', fg: 'currentColor', rotate: '0' };

const REGEX_TOKEN   = /^([a-z-]+)\(([^)]*)\)$/i;
const REGEX_SVG_VAR = /var\(\s*--aufbau-pattern-([\w-]+)\s*(?:,[^)]*)?\)/g;

/**
 * turns `aufbau-pattern: dots bg(green) fg(yellow) rotate(30)` into a static,
 * self-contained background-image data-uri.
 *
 * the raw svgs are loaded by an async pre-pass in ../index.js and handed in via
 * tokens.patternSvgs — this function stays synchronous, like transformIcons.
 *
 * @param {string} rawVal the declaration value (property name already stripped)
 * @param {Object} tokens pipeline tokens; reads tokens.color and tokens.patternSvgs
 */
export function transformPattern (rawVal, tokens) {
  const parts = rawVal.trim().split(/\s+/);
  const id    = parts.shift();

  const raw = tokens?.patternSvgs?.[id];
  // unknown id or svg not preloaded: leave the declaration untouched so a missing
  // asset is visible in the output rather than silently dropped.
  if (!raw) return `aufbau-pattern: ${rawVal};`;

  const vars = { ...FALLBACKS };
  for (const part of parts) {
    const m = part.match(REGEX_TOKEN);
    if (!m) continue;
    const [, key, val] = m;
    // colour tokens resolve through @aufbau color, exactly like aufbau-icon.
    vars[key] = tokens?.color?.[val] ?? val;
  }

  const svg = raw.replace(REGEX_SVG_VAR, (whole, key) =>
    key in vars ? String(vars[key]) : whole
  );

  return `background-image: url("${encodeSvg(svg)}");`;
}

export default transformPattern;
