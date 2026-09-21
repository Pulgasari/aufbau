// @aufbau/gui

import { fieldElement, renderElement } from './element.js';
import { fieldHTML, renderHTML }       from './html.js';
import { readValues }                  from './read.js';

// a single field in either format
function field (key, spec, value, options = {}) {
  return options.format === 'html' 
    ? fieldHTML    (key, spec, value) 
    : fieldElement (key, spec, value);
}

// a whole spec: dom container/fragment (default) or html string
function render (spec, options = {}) {
  return options.format === 'html' 
    ? renderHTML    (spec, options) 
    : renderElement (spec, options);
}

export         { field, readValues, render };
export default { field, readValues, render };
