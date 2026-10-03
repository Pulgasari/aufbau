// @aufbau/elements2/lib/options.js
// options as { value, label, icon, disabled, selected }: read from child
// elements, or turned out of whatever data a json file or a list brings.

import { isArray, isPlainObject } from '@pulgasari/is';

const OPTION_SELECTOR = 'input-option, option';

// a list hidden in a wrapper, as apis like to send it: { items: […] }, { data: […] }, …
function unwrap (data) {
  if (isArray(data)) return data;
  if (isPlainObject(data)) return data.items ?? data.data ?? data.results ?? Object.values(data);
  return [];
}

// one option out of a plain value or an object. `key` and `labelKey` name the
// fields where they are not called value and label
export function toOption (entry, { key = 'value', labelKey = 'label' } = {}) {
  if (!isPlainObject(entry)) {
    const value = entry == null ? '' : String(entry);
    return { disabled: false, icon: null, label: value, value };
  }

  const value = entry[key] ?? entry.value ?? entry.name ?? Object.values(entry)[0] ?? '';
  const label = entry[labelKey] ?? entry.label ?? entry.name ?? value;

  return {
    disabled : Boolean(entry.disabled),
    icon     : entry.icon ?? null,
    label    : String(label),
    value    : String(value),
  };
}

export function normalizeOptions (data, fields) {
  return unwrap(data).map(entry => toOption(entry, fields));
}

// the <input-option> and <option> children. they stay in the dom and are read
// again on every call, so options can be added and dropped at any time
export function readOptions (host) {
  const options = [];

  for (const element of host.querySelectorAll(OPTION_SELECTOR)) {
    const label = element.getAttribute('label') ?? element.textContent.trim();

    options.push({
      disabled : element.hasAttribute('disabled'),
      icon     : element.getAttribute('icon'),
      label,
      selected : element.hasAttribute('selected'),
      value    : element.getAttribute('value') ?? label,
    });
  }

  return options;
}
