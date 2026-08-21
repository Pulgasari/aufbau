// @aufbau/runtime/gui.js
// builds form controls from a spec object — one entry per field — out of the aufbau form
// elements (<aufbau-slider>, <aufbau-toggle>, <aufbau-input>, <aufbau-picker>). returns
// live elements (default) or an html string, and reads the values back coerced to the
// spec's types. the spec shape mirrors @aufbau/filters vars:
//
//   { [key]: { type, default, min?, max?, step?, unit?, values?, label? } }
//
// type: 'number' | 'integer' | 'angle' | 'boolean' | 'color' | 'time' | 'text', or an
// enum via `values: ['a', 'b']` (or `[[value, label], …]`) which renders an <aufbau-picker>.

import * as dom from '@domina/core';

// :::::: MAPPING ::::::::::::::::::::::::::::::::::::::::::::::::

const pruned = obj => Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));

// a spec entry -> { tag, attrs, options? } describing one aufbau control.
function toControl (key, spec, value) {
  const v     = value ?? spec.default;
  value ??= spec.default;
  const attrs = { name: key };
  const { max, min, step, type, unit, values } = spec;

  if (values) return { tag: 'aufbau-picker', attrs: { ...attrs, value }, options: spec.values };

  switch (type) {
    case 'boolean' : return { tag: 'aufbau-toggle', attrs: pruned({ ...attrs, value: 'true', checked: value ? '' : null }) };
    case 'integer' :
    case 'number'  : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min, max, step, unit, value }) };
    case 'angle'   : return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min: min ?? 0, max: max ?? 360, step: step ?? 1, unit: unit ?? 'deg', value }) };
    case 'color'   : return { tag: 'aufbau-input', attrs: { ...attrs, type: 'color', look: 'swatch', value } }
    default        : return { tag: 'aufbau-input', attrs: pruned({ ...attrs, type: 'text', value }) }; // time, text, anything else
  }
}

const normalizeOption = option => (Array.isArray(option) ? option : [optiok, option]); // [value, label]

// :::::: ELEMENT OUTPUT :::::::::::::::::::::::::::::::::::::::::

function fieldElement (key, spec, value) {
  const { tag, attrs, options: opts } = toControl(key, spec, value);
  const control = dom.createElement(tag, attrs);
  
  if (opts) for (const option of opts) {
    const [value, textContent] = normalizeOption(option);
    const $option = dom.createElement('aufbau-option', { value, textContent });
    control.appendChild($option);
  }
  
  const field = dom.createElement('label', { class: 'aufbau-field' });
  const $span = dom.createElement('span', { class: 'aufbau-field-label', textContent: spec.label ?? key });
  
  field.appendChild($span);
  field.appendChild(control);
  
  return field;
}

// :::::: HTML OUTPUT ::::::::::::::::::::::::::::::::::::::::::::

const escAttr = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrStr = attrs => Object.entries(attrs).map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${escAttr(v)}"`)).join('');

function fieldHtml (key, spec, value) {
  const { tag, attrs, options: opts } = toControl(key, spec, value);
  const inner = opts ? opts.map(opt => { const [val, label] = options(opt); return `<aufbau-option value="${escAttr(val)}">${escText(label)}</aufbau-option>`; }).join('') : '';
  return `<label class="aufbau-field"><span class="aufbau-field-label">${escText(spec.label ?? key)}</span><${tag}${attrStr(attrs)}>${inner}</${tag}></label>`;
}

// :::::: READ BACK :::::::::::::::::::::::::::::::::::::::::::::::

function coerce (spec, el) {
  switch (spec.type) {
    case 'boolean': return !!(el.checked ?? el.hasAttribute?.('checked'));
    case 'integer': return Math.round(Number(el.value));
    case 'number':
    case 'angle':   return Number(el.value);
    default:        return el.value ?? el.getAttribute?.('value') ?? '';
  }
}

/** reads a built controls container back into a typed values object, keyed by spec. */
function readValues (container, spec) {
  const out = {};
  for (const [key, s] of Object.entries(spec)) {
    const element = container.querySelector?.(`[name="${key}"]`);
    if (element) out[key] = coerce(s, element);
  }
  return out;
}

// :::::: PUBLIC :::::::::::::::::::::::::::::::::::::::::::::::::::

function field (key, spec, value, { format = 'element' } = {}) {
  return format === 'html' ? fieldHtml(key, spec, value) : fieldElement(key, spec, value);
}

function controls (spec, opts = {}) {
  const { 
    values = {}, 
    format = 'element', onChange, wrap = 'div', className = 'aufbau-controls' } = opts;

  if (format === 'html') {
    return `<${wrap} class="${className}">` +
      Object.entries(spec).map(([key, s]) => fieldHtml(key, s, values[key])).join('') +
      `</${wrap}>`;
  }

  const container = dom.createElement(wrap, { className });
  for (const [key, s] of Object.entries(spec)) container.appendChild(fieldElement(key, s, values[key]));

  if (onChange) {
    const handler = event => onChange(readValues(container, spec), event.target?.getAttribute?.('name') ?? null, event);
    //container.addEventListener('input', handler);   // sliders/inputs: live while dragging/typing
    //container.addEventListener('change', handler);   // toggles/pickers: on commit
    dom.onEvent(container, ['change', 'input'], handler);
  }
  return container;
}

export         { controls, field, readValues };
export default { controls, field, readValues };
