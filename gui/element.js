// @aufbau/gui/element.js
// dom renderer. builds real nodes via @domina/methods; the aufbau-* controls it
// emits must be registered by the consumer (@aufbau/elements is a peer).

import createElement  from '@domina/methods/createElement.js';
import createFragment from '@domina/methods/createFragment.js';
import onEvent        from '@domina/methods/onEvent.js';

import { normalizeOption, toControl } from './control.js';
import { readValues }                 from './read.js';

// one field as dom: <label><span>label</span><aufbau-control/></label>
export function fieldElement (key, spec, value) {
  const { tag, attrs, options } = toControl(key, spec, value);
  const control = createElement(tag, attrs);

  if (options) for (const option of options) {
    const [value, textContent] = normalizeOption(option);
    control.append(createElement('aufbau-option', { value, textContent }));
  }

  const field = createElement('label');
  field.append(createElement('span', { textContent: spec.label ?? key }), control);
  return field;
}

// a whole spec as a dom container (or fragment when wrap is false). onChange
// fires on change/input with (values, name, event).
export function renderElement (spec, { values = {}, wrap = 'div', onChange } = {}) {
  const container = wrap ? createElement(wrap) : createFragment();
  for (const [key, s] of Object.entries(spec)) container.append(fieldElement(key, s, values[key]));

  if (onChange) {
    // resolve the field name off the nearest named control, not the raw target:
    // composite controls (aufbau-picker) bubble change/input from an inner
    // element that carries no name, which would otherwise read back as null
    const handler = event => onChange(readValues(container, spec), event.target?.closest?.('[name]')?.getAttribute('name') ?? null, event);
    onEvent(container, ['change', 'input'], handler);
  }
  return container;
}
