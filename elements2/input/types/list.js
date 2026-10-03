// what the list types share. a list type has `list.entries (host, locale)`:
// [{ value, label, icon }] or a promise of them, built again whenever one of
// its `attributes` or the language changes

import text from './text.js';

/** a space separated attribute as a list, the fallback when it is empty */
export const listOf = (value, fallback) => value?.trim() ? value.trim().split(/\s+/) : fallback;

/** a flag that is on unless it says "false" */
export const enabled = (host, name) => host.getAttribute(name) !== 'false';

export const byLabel = locale => (a, b) => a.label.localeCompare(b.label, locale);

/** Intl.DisplayNames, null where the locale or the type is not supported */
export function displayNames (locale, type, options = {}) {
  try   { return new Intl.DisplayNames([locale], { fallback: 'code', type, ...options }); }
  catch { return null; }
}

/** the name of a code, the code itself where Intl has none */
export function nameOf (names, code) {
  try   { return names?.of(code) ?? code; }
  catch { return code; }
}

// the base of a list type: a combobox over a text value. `query` marks a type
// whose entries depend on what was typed into its search field
export const listType = ({ attributes = [], entries, icon = null, look = 'combobox', placeholder, query = false }) => ({
  ...text,
  attributes,
  icon,
  list : { entries, query },
  look,
  placeholder,
});

// a search shows the current value first, a new search must not make it vanish
export function withCurrent (host, entries, entryOf) {
  const value = host.value;
  if (!value) return entries;

  const others = entries.filter(entry => entry.value !== value);
  return [entryOf(value), ...others];
}
