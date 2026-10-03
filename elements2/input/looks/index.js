// @aufbau/elements2/input/looks
// how a value is entered. one file per look, each a plain object:
//
//   fits (shape)       whether it can show a value of that shape:
//                      { axis, count: single | range | multiple, kind: free | list | bool, steppable, type }
//   css                its styles. adopted only while it is drawn, so no selector needs a prefix
//   render (host)      the markup inside the part `box`
//   events (host, on)  its listeners. `on` is host.on(), they are dropped when the look changes
//   update (host)      the state onto the markup, on every update
//   focus (host)       what takes the focus
//   role (host)        the aria role of the host, none by default
//
// a look changes the value through the methods of ../Input.js only:
// setPart, setNumber, step, select, cycle, add, removeAt, toggle.

import { BASE_LAYER } from '../../lib/styles.js';

import button   from './button.js';
import checkbox from './checkbox.js';
import chips    from './chips.js';
import combobox from './combobox.js';
import cycle    from './cycle.js';
import field    from './field.js';
import fields   from './fields.js';
import grid     from './grid.js';
import pattern  from './pattern.js';
import radio    from './radio.js';
import segments from './segments.js';
import slider   from './slider.js';
import stepper  from './stepper.js';
import swatch   from './swatch.js';
import toggle   from './switch.js';

export const LOOKS = { button, checkbox, chips, combobox, cycle, field, fields, grid, pattern, radio, segments, slider, stepper, swatch, switch: toggle };

// drawn when neither the author nor the type asks for a look that fits
const FALLBACK = ['field', 'fields', 'chips', 'combobox', 'switch'];

export function lookFor (shape, ...wanted) {
  for (const name of [...wanted, ...FALLBACK]) if (name && LOOKS[name]?.fits(shape)) return name;
  return 'field';
}

const sheets = new Map;

/** the stylesheet of a look, built once and shared by every element that draws it */
export function sheetOf (name) {
  if (!sheets.has(name)) {
    const sheet = new CSSStyleSheet;
    sheet.replaceSync(`@layer ${BASE_LAYER} { ${LOOKS[name].css} }`);
    sheet.isLookSheet = true;
    sheets.set(name, sheet);
  }
  return sheets.get(name);
}
