// @domina/sortElements.js

import { getElement, getElements }         from './core.js';
import { isArray, isDate, isFn, isString } from './utils.js';

const sortModes = {
  regular: (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }),
  num:     (a, b) => parseFloat(a) - parseFloat(b),
  date:    (a, b) => {
    const parseDate = (v) => {
      const m = String(v).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      return m ? new Date(+m[3], +m[2] - 1, +m[1]) : new Date(v);
    };
    return parseDate(a) - parseDate(b);
  },
  auto: (a, b) => (isDate(a) && isDate(b)) ? sortModes.date(a, b) : sortModes.regular(a, b),
};

export function sortElements ({ container, item, indicators }) {
  const $container = getElement(container);
  if (!$container) {
    console.warn(`Container "${container}" not found.`);
    return;
  }

  const items = getElements(item, $container);
  const defaultOrder = 'auto-asc';

  // Normalize indicator specs
  const specs = [].concat(indicators).map(spec => {
    if (isString(spec)) return { selector: spec,    order:            defaultOrder };
    if (isArray(spec))  return { selector: spec[0], order: spec[1] || defaultOrder };
    return { order: defaultOrder, ...spec };
  });

  items.sort((a, b) => {
    for (const { selector, order } of specs) {
      const valA = a.querySelector(selector)?.textContent.trim() || '';
      const valB = b.querySelector(selector)?.textContent.trim() || '';

      let result = 0;

      if (order === 'random') {
        result = Math.random() - 0.5;
      } else if (isFn(order)) {
        result = order(valA, valB);
      } else {
        const [mode, direction] = order.includes('-')
          ? order.split('-')
          : ['auto', order];

        const strategy = sortModes[mode] || sortModes.auto;
        result = strategy(valA, valB);
        if (direction === 'desc') result *= -1;
      }

      if (result !== 0) return result;
    }
    return 0;
  });

  // Re-append in new order via DocumentFragment
  const frag = document.createDocumentFragment();
  items.forEach(el => frag.append(el));
  $container.append(frag);
}
