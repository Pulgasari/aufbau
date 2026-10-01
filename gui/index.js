// @aufbau/gui

import { fieldElement, renderElement } from './element.js';
import { fieldHTML, renderHTML }       from './html.js';
import { withControls }                from './control.js';
import { readValues }                  from './read.js';

// a single field in either format
// options.controls: defaults per type and overrides per key, see control.js
function field (key, spec, value, options = {}) {
  const entry = withControls({ [key]: spec }, options.controls)[key];
  return options.format === 'html'
    ? fieldHTML    (key, entry, value)
    : fieldElement (key, entry, value);
}

// a whole spec: dom container/fragment (default) or html string
function render (spec, options = {}) {
  const resolved = withControls(spec, options.controls);
  return options.format === 'html'
    ? renderHTML    (resolved, options)
    : renderElement (resolved, options);
}

export         { field, readValues, render };
export default { field, readValues, render };
