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
  const attrs = { name: key };

  if (spec.values) return { tag: 'aufbau-picker', attrs: { ...attrs, value: v }, options: spec.values };

  switch (spec.type) {
    case 'boolean':
      return { tag: 'aufbau-toggle', attrs: pruned({ ...attrs, value: 'true', checked: v ? '' : null }) };
    case 'integer':
    case 'number':
      return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min: spec.min, max: spec.max, step: spec.step, unit: spec.unit, value: v }) };
    case 'angle':
      return { tag: 'aufbau-slider', attrs: pruned({ ...attrs, type: 'number', min: spec.min ?? 0, max: spec.max ?? 360, step: spec.step ?? 1, unit: spec.unit ?? 'deg', value: v }) };
    case 'color':
      return String(v).startsWith('#')
        ? { tag: 'aufbau-input', attrs: { ...attrs, type: 'color', look: 'swatch', value: v } }
        : { tag: 'aufbau-input', attrs: { ...attrs, type: 'text', value: v } };
    default: // time, text, anything else
      return { tag: 'aufbau-input', attrs: pruned({ ...attrs, type: 'text', value: v }) };
  }
}

const options = opt => (Array.isArray(opt) ? opt : [opt, opt]); // [value, label]

// :::::: ELEMENT OUTPUT :::::::::::::::::::::::::::::::::::::::::

function fieldElement (key, spec, value) {
  const { tag, attrs, options: opts } = toControl(key, spec, value);
  const control = dom.createElement(tag, attrs);
  if (opts) for (const opt of opts) {
    const [val, label] = options(opt);
    control.appendChild(dom.createElement('aufbau-option', { value: val, textContent: label }));
  }
  const field = dom.createElement('label', { class: 'aufbau-field' });
  field.appendChild(dom.createElement('span', { class: 'aufbau-field-label', textContent: spec.label ?? key }));
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
export function readValues (container, spec) {
  const out = {};
  for (const [key, s] of Object.entries(spec)) {
    const el = container.querySelector?.(`[name="${key}"]`);
    if (el) out[key] = coerce(s, el);
  }
  return out;
}

// :::::: PUBLIC :::::::::::::::::::::::::::::::::::::::::::::::::::

/**
 * builds one field.
 * @param {string} format 'element' (default) or 'html'
 */
export function field (key, spec, value, { format = 'element' } = {}) {
  return format === 'html' ? fieldHtml(key, spec, value) : fieldElement(key, spec, value);
}

/**
 * builds a whole controls block from a spec.
 * @param {object} spec               field descriptors keyed by name
 * @param {object} [opts]
 * @param {object} [opts.values]      current values (fall back to each field's default)
 * @param {'element'|'html'} [opts.format='element']
 * @param {string} [opts.wrap='div']  wrapper tag
 * @param {string} [opts.className='aufbau-controls']
 * @param {(values, name, event)=>void} [opts.onChange]  element mode only: wired to input/change
 * @returns {HTMLElement|string}
 */
export function controls (spec, opts = {}) {
  const { values = {}, format = 'element', onChange, wrap = 'div', className = 'aufbau-controls' } = opts;

  if (format === 'html') {
    return `<${wrap} class="${className}">` +
      Object.entries(spec).map(([key, s]) => fieldHtml(key, s, values[key])).join('') +
      `</${wrap}>`;
  }

  const container = dom.createElement(wrap, { class: className });
  for (const [key, s] of Object.entries(spec)) container.appendChild(fieldElement(key, s, values[key]));

  if (onChange) {
    const handler = event => onChange(readValues(container, spec), event.target?.getAttribute?.('name') ?? null, event);
    container.addEventListener('input', handler);   // sliders/inputs: live while dragging/typing
    container.addEventListener('change', handler);   // toggles/pickers: on commit
  }
  return container;
}

export default { controls, field, readValues };
