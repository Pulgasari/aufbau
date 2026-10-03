// @aufbau/elements/core/options.js
// shared option handling for every container that offers a choice.
// replaces the three near identical normalize() copies that used to live in
// AufbauCombobox, AufbauSwitch and AufbauDatalist.

import { isArray, isPlainObject } from '@pulgasari/is';

// wrapped payloads are common enough that unwrapping them is worth doing here
const unwrap = (data) =>
    isArray(data)       ? data
  : isPlainObject(data) ? (data.items ?? data.data ?? data.results ?? Object.values(data))
  : [];

const OPTION_SELECTOR = 'aufbau-option, option, [data-value]';

/** { value, label, icon, disabled } from anything an author might hand us */
export const toOption = (entry, { key = 'value', labelKey = 'label' } = {}) => {
  if (!isPlainObject(entry)) {
    const value = entry == null ? '' : String(entry);
    return { value, label: value, icon: null, disabled: false };
  }

  const value = entry[key] ?? entry.value ?? entry.name ?? Object.values(entry)[0] ?? '';
  return {
    value    : String(value),
    label    : String(entry[labelKey] ?? entry.label ?? entry.name ?? value),
    icon     : entry.icon ?? null,
    disabled : Boolean(entry.disabled),
  };
};

export const normalizeOptions = (data, options) => unwrap(data).map(entry => toOption(entry, options));

/**
 * reads <aufbau-option>, <option> and [data-value] children.
 * the elements stay in the dom, they are the source of truth and must survive
 * every re-render of the container.
 *
 * `ignore` must be the container's own render shell. without it the rendered
 * options, which carry data-value themselves, would be read back in as sources.
 */
export const readOptions = (host, { ignore } = {}) => [...host.querySelectorAll(OPTION_SELECTOR)]
  .filter(element => !ignore?.contains(element))
  .map(element => ({
  value    : element.getAttribute('value') ?? element.dataset.value ?? element.textContent.trim(),
  label    : element.getAttribute('label') ?? element.textContent.trim(),
  icon     : element.getAttribute('icon'),
  disabled : element.hasAttribute('disabled'),
  selected : element.hasAttribute('selected'),
}));

/**
 * watches option children so a container repaints when they are added or removed.
 * `ignore` must be the container's own render shell, otherwise every repaint
 * would feed itself back in as a mutation.
 */
export const observeOptions = (host, onChange, { ignore } = {}) => {
  const observer = new MutationObserver(records => {
    if (records.some(record => !ignore?.contains(record.target))) onChange();
  });

  observer.observe(host, {
    attributeFilter : ['value', 'label', 'icon', 'disabled', 'selected'],
    attributes      : true,
    childList       : true,
    subtree         : true,
  });

  return () => observer.disconnect();
};

export { OPTION_SELECTOR };
