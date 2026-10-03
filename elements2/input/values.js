export const SEPARATORS = { multiple: ',', range: '..' };

// the string as its parts: [value], [from, to] or [a, b, …]
export function splitValue (raw, count) {
  const text = raw ?? '';
  if (count === 'single') return [text];

  const parts = text ? text.split(SEPARATORS[count]).map(part => part.trim()) : [];
  if (count === 'range') return [parts[0] ?? '', parts[1] ?? ''];
  return parts.filter(Boolean);
}

export function joinValue (parts, count) {
  if (count === 'single') return parts[0] ?? '';
  if (count === 'range')  return parts.some(Boolean) ? parts.map(part => part ?? '').join(SEPARATORS.range) : '';
  return parts.filter(Boolean).join(SEPARATORS.multiple);
}
