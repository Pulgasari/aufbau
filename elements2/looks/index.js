// @aufbau/elements2/looks/index.js
// the looks of the input-* elements. a look is a render module, no element:
//
//   fits (shape)          whether it can show a value of that shape
//                         { axis, count: single | range | multiple, kind: free | list | bool, type }
//   styles                its css, scoped with :host([look="…"])
//   render (host)         the markup of the shadow root
//   sync (host)           state onto that markup, on every update
//   bind (host, on)       listeners beyond the shared protocol, dropped when the look changes
//   role (host)           the aria role of the host, null by default
//   focusTarget (host)    what takes focus, the first field or button by default
//   selected (host)       called after an option was picked

import { chips }                     from './chips.js';
import { field, fields, stepper }    from './field.js';
import { combobox, cycle }           from './popup.js';
import { radio, segments }           from './inline.js';
import { slider }                    from './slider.js';
import { swatch }                    from './swatch.js';
import { button, checkbox, toggle }  from './toggle.js';

export const LOOKS = {
  button,
  checkbox,
  chips,
  combobox,
  cycle,
  field,
  fields,
  radio,
  segments,
  slider,
  stepper,
  swatch,
  switch: toggle,
};

// the first that fits is drawn when neither the author nor the type asks for one
const FALLBACK = ['field', 'fields', 'chips', 'combobox', 'switch'];

export function lookFor (shape, ...wanted) {
  for (const name of [...wanted, ...FALLBACK]) if (name && LOOKS[name]?.fits(shape)) return name;
  return 'field';
}
