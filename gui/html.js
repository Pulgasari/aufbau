// @aufbau/gui/html.js
// html-string renderer. pure and dependency-free (no dom, no @domina), so it
// also runs at build time / server side to emit markup the app hydrates later.

import { normalizeOption, toControl } from './control.js';

const escAttr = value => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const attrStr = attrs => Object.entries(attrs).map(([k, v]) => (v === '' ? ` ${k}` : ` ${k}="${escAttr(v)}"`)).join('');

// one field as an html string
export function fieldHTML (key, spec, value) {
  const { tag, attrs, options } = toControl(key, spec, value);
  const inner = options
    ? options.map(option => { const [val, label] = normalizeOption(option); return `<aufbau-option value="${escAttr(val)}">${escText(label)}</aufbau-option>`; }).join('')
    : '';
  return `<label class="aufbau-field"><span class="aufbau-field-label">${escText(spec.label ?? key)}</span><${tag}${attrStr(attrs)}>${inner}</${tag}></label>`;
}

// a whole spec as an html string, optionally wrapped in one element
export function renderHTML (spec, { values = {}, wrap = 'div' } = {}) {
  const body = Object.entries(spec).map(([key, s]) => fieldHTML(key, s, values[key])).join('');
  return wrap ? `<${wrap}>${body}</${wrap}>` : body;
}
