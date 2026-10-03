// @aufbau/gui/read.js
// reads a rendered controls container back into a typed values object. pure and
// dependency-free: it only touches standard element props and querySelector.

import { isSection, sectionFields } from './control.js';

// one control element -> its typed value, per the spec type
function coerce (spec, element) {
  switch (spec.type) {
    case 'boolean'  : return !!(element.checked ?? element.getAttribute?.('value') === 'true');
    case 'integer'  :
    case 'year'     : return Math.round(Number(element.value));
    case 'number'   :
    case 'angle'    : return Number(element.value);
    // date, datetime, duration (with its unit, "2s"), time, color, email, phone, url, password, text
    default         : return element.value ?? element.getAttribute?.('value') ?? '';
  }
}

// reads a built controls container back into a typed values object, keyed by
// spec. flat by default: the fields of sections read back next to all the
// others. nested: each section is an object of its own under its key
export function readValues (container, spec, { nested = false } = {}) {
  return readInto({}, container, spec, nested);
}

function readInto (out, container, spec, nested) {
  for (const [key, entry] of Object.entries(spec)) {
    if (isSection(entry)) {
      readInto(nested ? (out[key] = {}) : out, container, sectionFields(entry), nested);
      continue;
    }
    const element = container.querySelector?.(`[name="${key}"]:not(fieldset)`);
    if (element) out[key] = coerce(entry, element);
  }
  return out;
}

export default readValues;
