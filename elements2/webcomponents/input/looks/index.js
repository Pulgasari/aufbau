import { BASE_LAYER } from '../../../lib/styles.js';

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

const FALLBACK = ['field', 'fields', 'chips', 'combobox', 'switch'];

export function lookFor (shape, ...wanted) {
  for (const name of [...wanted, ...FALLBACK]) if (name && LOOKS[name]?.fits(shape)) return name;
  return 'field';
}

const sheets = new Map;

export function sheetOf (name) {
  if (!sheets.has(name)) {
    const sheet = new CSSStyleSheet;
    sheet.replaceSync(`@layer ${BASE_LAYER} { ${LOOKS[name].css} }`);
    sheet.isLookSheet = true;
    sheets.set(name, sheet);
  }
  return sheets.get(name);
}
