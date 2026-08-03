// values.js

import { _el }                           from './core.js';
import { arrayfied, isArray }            from './utils.js';
import { parseDate, toDateInput, toNum } from './utils.js';

const isCheckableElement = el => el.type === 'checkbox' || el.type === 'radio';
const isMultiElement     = el => el.tagName === 'SELECT' && el.multiple;

const casts = {
  bool   : v => Boolean(isArray(v) ? v.length : v),
  date   : v => parseDate(v),
  number : v => toNum(v) ?? 0,
  string : v => isArray(v) ? v.join(', ') : String(v ?? ''),
};

export const getValue = (node, mode = null) => {
  const el  = _el(node); if (!el) return null;
  const raw = isCheckableElement (el) ? el.checked
            : isMultiElement     (el) ? [...el.selectedOptions].map(o => o.value)    
            : 'value' in el ? el.value : el.textContent ?? '';

  return mode && casts[mode] ? casts[mode](raw) : raw;
};

export const setValue = (node, value, { notify = false } = {}) => {
  const el = _el(node); if (!el) return null;

  if (isCheckableElement(el)) {
    el.checked = Boolean(value);
  }
  else if (isMultiElement(el)) {
    const values = arrayfied(value).map(String);
    for (const opt of el.options) opt.selected = values.includes(opt.value);
  }
  else if ('value' in el) {
    el.value = (value instanceof Date && el.type === 'date')
      ? toDateInput(value)
      : value ?? '';
  }
  else el.textContent = value ?? '';

  if (notify) {
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  return el;
};



