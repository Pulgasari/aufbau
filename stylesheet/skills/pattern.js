// @aufbau/stylesheet/skills/pattern.js
// parses the ass pattern syntax and emits the prebuilt data-uri.
// all svg work lives in @aufbau/patterns; nothing svg-related happens here.

const REGEX_TOKEN = /^([a-z-]+)\(([^)]*)\)$/i;

/**
 * splits `dots bg(green) fg(yellow)` into { id, options }.
 * colour tokens resolve through @aufbau color, like aufbau-icon.
 */
export function parsePattern (rawVal, tokens) {
  const parts = rawVal.trim().split(/\s+/);
  const id    = parts.shift();

  const options = {};
  for (const part of parts) {
    const m = part.match(REGEX_TOKEN);
    if (!m) continue;
    const [, key, val] = m;
    options[key] = tokens?.color?.[val] ?? val;
  }
  return { id, options };
}

/**
 * emits the background-image declaration. the finished image string is looked up
 * from tokens.patternImages, keyed by the exact rawVal, and filled by the async
 * pre-pass in ../index.js before the synchronous pass runs.
 */
export function transformPattern (rawVal, tokens) {
  const image = tokens?.patternImages?.[rawVal.trim()];
  // not preloaded (unknown id or load failure): leave the declaration visible.
  if (!image) return `aufbau-pattern: ${rawVal};`;
  return `background-image: ${image};`;
}

export default transformPattern;
