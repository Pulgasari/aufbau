// filterElements.js

import { getElement, getElements } from './core.js';
import { isArray, isEmpty, isFn }  from './utils.js';
import { getValue, setValue }      from './values.js';


const parseVal = (v) => {
  const m = String(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  if (!isNaN(Date.parse(v)) && isNaN(Number(v))) return new Date(v);
  return v;
};

const stringFilter = (fn) => (value, search) =>
  String(value ?? '').toLowerCase()[fn](String(search).toLowerCase());

const filterModes = {
  // String
  contains   : stringFilter('includes'),
  includes   : stringFilter('includes'),
  startsWith : stringFilter('startsWith'),
  endsWith   : stringFilter('endsWith'),
  exact      : (value, search) => String(value).toLowerCase() === String(search).toLowerCase(),

  // Numeric
  'num-eq' : (value, search) => parseFloat(value) === parseFloat(search),
  'num-gt' : (value, search) => parseFloat(value)  >  parseFloat(search),
  'num-lt' : (value, search) => parseFloat(value)  <  parseFloat(search),

  // Date
  'date-eq'     : (value, search) => {
    const d1 = parseVal(value), d2 = parseVal(search);
    return d1 instanceof Date && d2 instanceof Date && d1.getTime() === d2.getTime();
  },
  'date-after'  : (value, search) => {
    const d1 = parseVal(value), d2 = parseVal(search);
    return d1 instanceof Date && d2 instanceof Date && d1 > d2;
  },
  'date-before' : (value, search) => {
    const d1 = parseVal(value), d2 = parseVal(search);
    return d1 instanceof Date && d2 instanceof Date && d1 < d2;
  },
};

export function filterElements({
  container,
  item,
  filters,
  mismatchClass = 'hidden',
}) {
  const $container = _el(container);
  if (!$container) {
    console.warn('Container not found.');
    return;
  }

  const items = getElements(item, $container);

  // Normalize filter specs
  const specs = [].concat(filters).map(spec => {
    if (isFn(spec))    return { customFn: spec };
    if (isArray(spec)) return { selector: spec[0], value: spec[1], mode: spec[2] || 'contains' };
    return { mode: 'contains', ...spec };
  });

  items.forEach(el => {
    let matches = true;

    for (const { selector, value, mode, customFn } of specs) {
      if (isEmpty(value) && !customFn) continue;

      const target    = selector ? getElement(selector, el) : el;
      const itemValue = getValue(target) ?? '';

      let result = false;

      if (isFn(customFn)) {
        result = customFn(itemValue, value, el);
      } else {
        const strategy = filterModes[mode] || filterModes.contains;
        result = strategy(itemValue, value);
      }

      if (!result) {
        matches = false;
        break; // AND logic
      }
    }

    el.classList.toggle(mismatchClass, !matches);
  });
}
