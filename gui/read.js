// @aufbau/gui/read.js
// reads a rendered controls container back into a typed values object. pure and
// dependency-free: it only touches standard element props and querySelector.

// one control element -> its typed value, per the spec type
function coerce (spec, element) {
  switch (spec.type) {
    case 'boolean'  : return !!(element.checked ?? element.hasAttribute?.('checked'));
    case 'integer'  :
    case 'year'     : return Math.round(Number(element.value));
    case 'number'   :
    case 'angle'    : return Number(element.value);
    // the slider's numeric value is the bare amount; typedValue re-attaches the
    // unit, so a duration reads back self-describing as "2s"/"500ms"
    case 'duration' : return element.typedValue ?? element.value;
    // date, datetime, time, color, email, phone, url, password, text
    default         : return element.value ?? element.getAttribute?.('value') ?? '';
  }
}

// reads a built controls container back into a typed values object, keyed by spec
export function readValues (container, spec) {
  const out = {};
  for (const [key, s] of Object.entries(spec)) {
    const element = container.querySelector?.(`[name="${key}"]`);
    if (element) out[key] = coerce(s, element);
  }
  return out;
}

export default readValues;
