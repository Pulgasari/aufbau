// @aufbau/components/core/locale.js

/** the language an element is shown in: the nearest [lang], the document, the browser */
export const localeOf = element =>
  element.closest('[lang]')?.lang || document.documentElement.lang || navigator.language;

/** Intl.DisplayNames or null where the locale or the type is not supported */
export function displayNames (locale, type, options = {}) {
  try { return new Intl.DisplayNames([locale], { fallback: 'code', type, ...options }); }
  catch { return null; }
}

/** the name of a code, the code itself where Intl has none */
export function nameOfCode (names, code) {
  try { return names?.of(code) ?? code; }
  catch { return code; }
}
