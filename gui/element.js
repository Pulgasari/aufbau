// @aufbau/gui/element.js

// dom renderer. builds real nodes via @domina/methods; 
// the aufbau-* controls it emits must be registered by the consumer.

import createElement  from '@domina/methods/createElement.js';
import createFragment from '@domina/methods/createFragment.js';
import onEvent        from '@domina/methods/onEvent.js';

import { isSection, normalizeOption, sectionFields, toControl } from './control.js';
import { readValues }                                           from './read.js';

// one field as dom: <label><span>label</span><aufbau-control/></label>
function fieldElement (key, spec, value) {
  const { tag, attrs, options } = toControl(key, spec, value);

  // attributes, not props: createElement sets a writable property where the tag
  // has one, and on a defined aufbau-toggle `checked = ''` would read as false
  const control = createElement(tag);
  for (const [name, attr] of Object.entries(attrs)) control.setAttribute(name, attr);

  if (options) for (const option of options) {
    const [value, textContent] = normalizeOption(option);
    const $option = createElement('aufbau-option', { value, textContent });
    control.append($option);
  }

  const field = createElement('label');
  const $span = createElement('span', { textContent: spec.label ?? key });
  
  field.append($span, control);
  return field;
}

// a section as dom: <fieldset name="key"><legend>key</legend>fields</fieldset>
function sectionElement (key, section, values = {}) {
  const fieldset = createElement('fieldset', { className: 'aufbau-section', name: key });
  fieldset.append(createElement('legend', { textContent: key }), ...entryElements(sectionFields(section), values));
  return fieldset;
}

const entryElements = (spec, values) => Object.entries(spec)
  .map(([key, entry]) => isSection(entry) ? sectionElement(key, entry, values) : fieldElement(key, entry, values[key]));

// a whole spec as a dom container (or fragment when wrap is false). onChange
// fires on change/input with (values, name, event).
function renderElement (spec, { values = {}, wrap = 'div', onChange } = {}) {
  const container = wrap ? createElement(wrap) : createFragment();
  container.append(...entryElements(spec, values));

  if (onChange) {
    // resolve the field name off the nearest named control, not the raw target:
    // composite controls (aufbau-picker) bubble change/input from an inner
    // element that carries no name, which would otherwise read back as null
    // a fieldset carries the name of its section, it is no field
    const nameOf  = event => event.target?.closest?.('[name]:not(fieldset)')?.getAttribute('name') ?? null;
    const handler = event => onChange(readValues(container, spec), nameOf(event), event);
    onEvent(container, ['change', 'input'], handler);
  }
  return container;
}

export { fieldElement, renderElement, sectionElement };
