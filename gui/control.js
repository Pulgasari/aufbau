// @aufbau/gui/control.js
// maps a spec entry to a control descriptor { tag, attrs, options? }.
// pure, no dom, no deps: the same mapping feeds both the html and the element renderer.

const pruned = obj => Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));

// "0.5s" -> 0.5, "16px" -> 16, 5 -> 5, undefined -> null. strips a unit so the
// value can drive a plain-number slider attribute (min/max/step are axis units)
const NUMBER_PATTERN = /^\s*(-?\d*\.?\d+)/;
const numberOf = value => {
  if (value == null) return null;
  const m = NUMBER_PATTERN.exec(String(value));
  return m ? Number(m[1]) : null;
};

// attributes of a spec: false and nullish leave one out, true sets it bare
const flagged = (attrs = {}) => Object.fromEntries(Object.entries(attrs)
  .filter(([, value]) => value != null && value !== false)
  .map(([name, value]) => [name, value === true ? '' : value]));

// [value, label] from either a bare option or an explicit pair
const normalizeOption = option => (Array.isArray(option) ? option : [option, option]);

// a spec entry -> one aufbau control. `values` makes it a picker; otherwise
// `type` selects the widget, defaulting to aufbau-input (which validates the
// type itself and falls back to text for anything it does not know).
function toControl (key, spec, value) {
  value ??= spec.default;
  const attrs = { name: key };
  const { max, min, step, type, unit, values } = spec;

  // any other element by its tag, a component of @aufbau/components say. its
  // attrs ride along, true as a bare attribute; it has to read and write `value`
  if (spec.tag) return { tag: spec.tag, attrs: pruned({ ...flagged(spec.attrs), ...attrs, value }) };

  // `look` (combobox for a long list, segments/radio for a short one) rides
  // through when the spec sets it; pruned drops it when it does not
  if (values) return { tag: 'aufbau-picker', attrs: pruned({ ...attrs, value, look: spec.look }), options: values };

  switch (type) {
    case 'boolean'  : return { tag: 'aufbau-toggle', attrs: pruned({ ...attrs, value: 'true', checked: value ? '' : null }) };
    case 'integer'  :
    case 'number'   : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min, max, step, unit, value }) };
    case 'angle'    : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min: min ?? 0, max: max ?? 360, step: step ?? 1, unit: unit ?? 'deg', value }) };
    // duration carries its own unit ("2s") so the readout is self-describing;
    // min/max ride through (the domain parses them), step is a bare axis number
    case 'duration' : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'duration', min, max, step: numberOf(step), value }) };
    case 'year'     : return { tag: 'aufbau-input',  attrs: pruned({ ...attrs, type: 'year', look: 'stepper', min, max, step, value }) };
    case 'color'    : return { tag: 'aufbau-input',  attrs: pruned({ ...attrs, type: 'color', look: 'swatch', value }) };
  }

  // date, datetime, time, email, password, phone, text, url -> native aufbau-input
  return { tag: 'aufbau-input', attrs: pruned({ ...attrs, type, value }) };
}

// :::::: SECTIONS
// a key whose entry is an array is a section: the key names it, the records in
// the array hold its fields, merged in order. sections nest. the values are
// flat by default, readValues(…, { nested: true }) gives each section an object
// of its own.
//
//   { appearance: [{ palette: { values: […] } }, { density: { values: […] } }] }

const isSection = entry => Array.isArray(entry);

/** the fields of a section, its records merged */
const sectionFields = section => Object.assign({}, ...section.filter(record => record && typeof record === 'object'));

/** every field of a spec with the sections resolved, key -> descriptor */
const flattenSpec = spec => Object.fromEntries(Object.entries(spec).flatMap(([key, entry]) =>
  isSection(entry) ? Object.entries(flattenSpec(sectionFields(entry))) : [[key, entry]]));

/** the values a section's fields read from: nested under its key, with the flat ones as fallback */
const sectionValues = (values, key) => {
  const own = values?.[key];
  return own && typeof own === 'object' && !Array.isArray(own) ? { ...values, ...own } : values;
};

export { flattenSpec, isSection, normalizeOption, sectionFields, sectionValues, toControl };
export default toControl;
