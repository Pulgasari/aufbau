import text from './text.js';

export { displayNames, nameOf } from '../../../lib/locale.js';

export const listOf = (value, fallback) => value?.trim() ? value.trim().split(/\s+/) : fallback;

// a flag that is on unless it says "false"
export const enabled = (host, name) => host.getAttribute(name) !== 'false';

export const byLabel = locale => (a, b) => a.label.localeCompare(b.label, locale);

export const listType = ({ attributes = [], entries, icon = null, look = 'combobox', placeholder, query = false }) => ({
  ...text,
  attributes,
  icon,
  list : { entries, query },
  look,
  placeholder,
});

export function withCurrent (host, entries, entryOf) {
  const value = host.value;
  if (!value) return entries;

  const others = entries.filter(entry => entry.value !== value);
  return [entryOf(value), ...others];
}
