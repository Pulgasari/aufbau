// @aufbau/stylesheet/skills/filter.js
// parses the ass filter syntax and emits `filter: url(#id)` plus the option
// custom properties. the <filter> defs are injected into the dom by the async
// pre-pass in ../index.js; no svg work happens here.

const PROP_PREFIX = '--aufbau-filter-';
const REGEX_TOKEN = /^([a-z-]+)\(([^)]*)\)$/i;

/**
 * splits `grain frequency(1.2) opacity(0.3)` into { id, options }.
 */
export function parseFilter (rawVal) {
  const parts = rawVal.trim().split(/\s+/);
  const id    = parts.shift();

  const options = {};
  for (const part of parts) {
    const m = part.match(REGEX_TOKEN);
    if (!m) continue;
    const [, key, val] = m;
    options[key] = val.trim();
  }
  return { id, options };
}

/**
 * emits the filter declaration. only ids present in tokens.filterIds (populated
 * by the async pre-pass, meaning their defs were injected) are transformed;
 * unknown ones are left visible.
 */
export function transformFilter (rawVal, tokens) {
  const { id, options } = parseFilter(rawVal);
  if (!tokens?.filterIds?.has(id)) return `aufbau-filter: ${rawVal};`;

  const decls = [`filter: url(#aufbau-filter-${id});`];
  for (const [key, value] of Object.entries(options)) {
    decls.push(`${PROP_PREFIX}${key}: ${value};`);
  }
  return decls.join(' ');
}

export default transformFilter;
