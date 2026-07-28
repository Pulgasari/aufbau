// @aufbau/stylesheet/skills/unset.js

/**
 * Transforms aufbau-unset shorthand declarations into multiple 'unset' CSS properties.
 */
export function transformUnset (rawVal) {
  if (!rawVal) return '';

  const props = rawVal.trim().split(/[\s,]+/).filter(Boolean);
  if (props.length === 0) return '';

  return props.map(prop => `${prop}: unset;`).join(' ');
}

export default transformUnset;
