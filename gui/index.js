// @aufbau/gui
// spec-driven ui controls for the aufbau ecosystem. a spec maps field keys to
// descriptors (type, min/max/step, values, ...); render() emits the matching
// aufbau-* controls as dom elements or an html string, readValues() reads typed
// values back. the aufbau-* elements themselves come from @aufbau/elements.

import { fieldElement, renderElement } from './element.js';
import { fieldHTML, renderHTML }       from './html.js';
import { readValues }                  from './read.js';

// a single field in either format
export function field (key, spec, value, { format = 'element' } = {}) {
  return format === 'html' ? fieldHTML(key, spec, value) : fieldElement(key, spec, value);
}

// a whole spec: dom container/fragment (default) or html string
export function render (spec, options = {}) {
  return options.format === 'html' ? renderHTML(spec, options) : renderElement(spec, options);
}

export { readValues };
export default { field, readValues, render };
