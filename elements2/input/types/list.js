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

/** the base of a list type: a combobox over a text value */
export const listType = ({ attributes = [], entries, icon = null, placeholder }) => ({
  ...text,
  attributes,
  icon,
  list : { entries },
  look : 'combobox',
  placeholder,
});
