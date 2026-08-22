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

// a spec entry -> { tag, attrs, options? } describing one aufbau control.
function toControl (key, spec, value) {
  value ??= spec.default;
  const attrs = { name: key };
  const { max, min, step, type, unit, values } = spec;

  if (values) return { tag: 'aufbau-picker', attrs: { ...attrs, value }, options: spec.values };

  switch (type) {
    case 'boolean' : return { tag: 'aufbau-toggle', attrs: pruned({ ...attrs, value: 'true', checked: value ? '' : null }) };
    case 'integer' :
    case 'number'  : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min, max, step, unit, value }) };
    case 'angle'   : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min: min ?? 0, max: max ?? 360, step: step ?? 1, unit: unit ?? 'deg', value }) };    
    case 'color'   : return { tag: 'aufbau-input', attrs: { ...attrs, type: 'color', look: 'swatch', value } };
    default        : return { tag: 'aufbau-input', attrs: pruned({ ...attrs, type: 'text', value }) }; // time, text, anything else
  }
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
    case 'boolean' : return !!(element.checked ?? element.hasAttribute?.('checked'));
    case 'integer' : return Math.round(Number(element.value));
    case 'number'  :
    case 'angle'   : return Number(element.value);
    default        : return element.value ?? element.getAttribute?.('value') ?? '';
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
      const handler = event => onChange(readValues(container, spec), event.target?.getAttribute?.('name') ?? null, event);
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
