// @aufbau/runtime/gui.js

import * as dom from '@domina/core';

// :::::: HELPERS
// (vermutlich unnötig, weil innerhalb von @domina bereits gehandlet)

const escAttr = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrStr = attrs => Object.entries(attrs).map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${escAttr(v)}"`)).join('');

// :::::: MAPPING ::::::::::::::::::::::::::::::::::::::::::::::::

const pruned = obj => Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
const prunedWithFallbacks = (obj = {}, defaults = {}) => ({ ...defaults, ...pruned(obj) });

// "0.5s" -> 0.5, "16px" -> 16, 5 -> 5, undefined -> null. strips a unit off a value so
// it can be handed to a plain-number slider attribute (min/max/step live in axis units)
const NUMBER_PATTERN = /^\s*(-?\d*\.?\d+)/;
const numberOf       = value => { if (value == null) return null; const m = NUMBER_PATTERN.exec(String(value)); return m ? Number(m[1]) : null; };

// a spec entry -> { tag, attrs, options? } describing one aufbau control.
function toControl (key, spec, value) {
  value ??= spec.default;
  const attrs = { name: key };
  const { max, min, step, type, unit, values } = spec;

  // `look` (e.g. 'combobox' for a long list, 'segments'/'radio' for a short one)
  // rides through when the spec sets it; pruned drops it when it doesn't
  if (values) return { tag: 'aufbau-picker', attrs: pruned({ ...attrs, value, look: spec.look }), options: spec.values };

  switch (type) {
    case 'boolean'  : return { tag: 'aufbau-toggle', attrs: pruned({ ...attrs, value: 'true', checked: value ? '' : null }) };
    case 'integer'  :
    case 'number'   : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min, max, step, unit, value }) };
    case 'angle'    : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min: min ?? 0, max: max ?? 360, step: step ?? 1, unit: unit ?? 'deg', value }) };
    // the duration value type carries its own unit ("2s"), so the readout already shows
    // it — no separate unit label. min/max ride through as-is (the domain parses them);
    // the slider `step` is a plain number in the axis unit, so strip any unit off it
    case 'duration' : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'duration', min, max, step: numberOf(step), value }) };
    // a year is discrete and usually typed, so a number stepper beats a 200-wide slider
    case 'year'     : return { tag: 'aufbau-input', attrs: pruned({ ...attrs, type: 'year', look: 'stepper', min, max, step, value }) };
    case 'color'    : return { tag: 'aufbau-input', attrs: pruned({ ...attrs, type: 'color', look: 'swatch', value }) };
  }

  // date, datetime, time (wall-clock), email, password, phone, text and url are all
  // native aufbau-input fields. passing the value-type name straight through gives each
  // the right native input, icon and parsing; aufbau-input validates the type itself
  // and falls back to text for anything it does not know (and for an absent type)
  return { tag: 'aufbau-input', attrs: pruned({ ...attrs, type, value }) };
}

function toControl2 (key, spec, value = spec.default) {
  const { values, type, label, default: _, ...rest } = spec;

  const { attrs, tag } = {
    boolean : { tag: 'aufbau-toggle' , attrs: { value: 'true', checked: value ? '' : null  } },
    enum    : { tag: 'aufbau-picker' , attrs: { name: key }, options: values },
    
    integer : { tag: 'aufbau-slider' , attrs: { type: 'number' } },
    number  : { tag: 'aufbau-slider' , attrs: { type: 'number' } },
    angle   : { tag: 'aufbau-slider' , attrs: { type: 'number', min: 0, max: 360, step: 1, unit: 'deg' } },
    color   : { tag: 'aufbau-input'  , attrs: { type: 'color', look: 'swatch' } },
    //default : { tag: 'aufbau-input'  , attrs: { type: 'text'   } },
  }[type];
  
  return { tag, attrs: prunedWithFallbacks(rest, { ...attrs, name: key }) };
}

const normalizeOption = option => (Array.isArray(option) ? option : [option, option]); // [value, label]

// :::::: ELEMENT OUTPUT :::::::::::::::::::::::::::::::::::::::::

function fieldElement (key, spec, value) {
  const { tag, attrs, options } = toControl(key, spec, value);
  const $control = dom.createElement(tag, attrs);
  
  if (options) for (const option of options) {
    const [value, textContent] = normalizeOption(option);
    const $option = dom.createElement('aufbau-option', { value, textContent });
    $control.append($option);
  }
  
  const $field = dom.createElement('label');
  const $span  = dom.createElement('span', { textContent: spec.label ?? key });
  
  $field.append($span, $control);
  
  return $field;
}

// :::::: HTML OUTPUT ::::::::::::::::::::::::::::::::::::::::::::

function fieldHTML (key, spec, value) {
  const { tag, attrs, options } = toControl(key, spec, value);
  const inner = options ? options.map(opt => { const [val, label] = normalizeOption(opt); return `<aufbau-option value="${escAttr(val)}">${escText(label)}</aufbau-option>`; }).join('') : '';
  return `<label class="aufbau-field"><span class="aufbau-field-label">${escText(spec.label ?? key)}</span><${tag}${attrStr(attrs)}>${inner}</${tag}></label>`;
}

// :::::: READ BACK :::::::::::::::::::::::::::::::::::::::::::::::

function coerce (spec, element) {
  switch (spec.type) {
    case 'boolean'  : return !!(element.checked ?? element.hasAttribute?.('checked'));
    case 'integer'  :
    case 'year'     : return Math.round(Number(element.value));
    case 'number'   :
    case 'angle'    : return Number(element.value);
    // the slider's numeric `value` is the bare amount; typedValue re-attaches the unit,
    // so a duration reads back self-describing as "2s"/"500ms"
    case 'duration' : return element.typedValue ?? element.value;
    // date, datetime, time (wall-clock), color, email, phone, url, password, text
    default         : return element.value ?? element.getAttribute?.('value') ?? '';
  }
}

/** reads a built controls container back into a typed values object, keyed by spec. */
function getValues (container, spec) {
  const out = {};
  for (const [key, s] of Object.entries(spec)) {
    const element = container.querySelector?.(`[name="${key}"]`);
    //const element = dom.getElement({ name: key }, container);
    //const element = dom.element(container).getElement({ name: key });
    if (element) out[key] = coerce(s, element);
  }
  return out;
}

// :::::: PUBLIC :::::::::::::::::::::::::::::::::::::::::::::::::::

function field (key, spec, value, { format = 'element' } = {}) {
  return format === 'html' ? fieldHTML(key, spec, value) : fieldElement(key, spec, value);
}

function render (spec, opts = {}) {
  const {
    format = 'element', 
    values = {}, 
    wrap   = 'div', 
    onChange,
  } = opts;

  // render as html-string
  if (format === 'html') {
    const body = Object.entries(spec).map(([key, s]) => fieldHTML(key, s, values[key])).join('');
    return wrap ? `<${wrap}>${body}</${wrap}>` : body;
  }

  // render as dom-elements
  else {
    const container = wrap ? dom.createElement(wrap) : dom.createFragment();
    for (const [key, s] of Object.entries(spec)) {
      const value   = values[key];
      const element = fieldElement(key, s, value);
      container.append(element);
    }
  
    if (onChange) {
      // resolve the field name off the nearest named control, not the raw target:
      // composite controls (e.g. aufbau-picker) bubble change/input from an inner
      // element that carries no name, which would otherwise read back as null
      const handler = event => onChange(readValues(container, spec), event.target?.closest?.('[name]')?.getAttribute('name') ?? null, event);
      //container.addEventListener('input', handler);   // sliders/inputs: live while dragging/typing
      //container.addEventListener('change', handler);   // toggles/pickers: on commit
      dom.onEvent(container, ['change', 'input'], handler);
    }
    return container;
  }
}

// :::::: EXPORTS

const // temp alias (deprecated)
controls   = render,
readValues = getValues;

export         { controls, field, readValues };
export default { controls, field, readValues };
