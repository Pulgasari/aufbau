// @aufbau/elements2/input/values.js
// the value of an input-* element is one string, as on a native input.
// two values (range) and any number of them (multiple) are joined into it:
//
//   single     'hallo'
//   range      '100..300'      always two parts, an empty end stays empty
//   multiple   'red,green'

export const SEPARATORS = { multiple: ',', range: '..' };

/** the string as its parts: [value], [from, to] or [a, b, …] */
export function splitValue (raw, count) {
  const text = raw ?? '';
  if (count === 'single') return [text];

  const parts = text ? text.split(SEPARATORS[count]).map(part => part.trim()) : [];
  if (count === 'range') return [parts[0] ?? '', parts[1] ?? ''];
  return parts.filter(Boolean);
}

/** the parts as one string. a range with both ends empty is no value */
export function joinValue (parts, count) {
  if (count === 'single') return parts[0] ?? '';
  if (count === 'range')  return parts.some(Boolean) ? parts.map(part => part ?? '').join(SEPARATORS.range) : '';
  return parts.filter(Boolean).join(SEPARATORS.multiple);
}
