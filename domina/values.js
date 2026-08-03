// values.js

import { isArray } from './utils.js';

export const getValue = (node, mode = null) => {
    const el = _el(node);
    if (!el) return null;

    let value = isDings(el)   ? el.checked
              : isMulti(el)   ? Array.from(el.selectedOptions).map(o => o.value)
              : 'value' in el ? el.value
              : el.textContent || el.innerText || '';

    return {
      bool   : Boolean(value),
      date   : new Date(value),
      number : parseFloat(value) || 0,
      string : String(value),
    }[mode] ?? value;
};

export const setValue = (node, value) => {
    const el = _el(node);
    if (!el) return null;

    // Checkboxes & Radios
    if (isDings(el)) {
      el.checked = Boolean(value);
    }
    // Multi-select
    else if (isMulti(el)) {
      const values = isArray(value) ? value.map(String) : [String(value)];
      Array.from(el.options).forEach(opt => {
        opt.selected = values.includes(opt.value);
      });
    }
    // Standard form elements
    else if ('value' in el) {
      el.value = (value instanceof Date && el.type === 'date')
        ? value.toISOString().split('T')[0]
        : value;
    }
    // Non-form elements
    else {
      el.textContent = value;
    }
  };
