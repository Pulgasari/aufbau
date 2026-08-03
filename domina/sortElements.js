// sortElements.js

import { _el, getElement, getElements }    from './core.js';
import { isArray, isFn, isString }         from './utils.js';
import { parseDate, shuffle, toNum }       from './utils.js';
import { getValue }                        from './values.js';

// unparsebare Werte landen immer am Ende (auch bei desc – gewollt)
const nullsLast = (a, b) => (a === null && b === null) ? 0 : a === null ? 1 : b === null ? -1 : null;

const sortModes = {
  regular: (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }),

  num: (a, b) => {
    const x = toNum(a), y = toNum(b);
    return nullsLast(x, y) ?? x - y;
  },

  date: (a, b) => {
    const x = parseDate(a), y = parseDate(b);
    return nullsLast(x, y) ?? x - y;
  },

  auto: (a, b) => (parseDate(a) && parseDate(b)) ? sortModes.date(a, b) : sortModes.regular(a, b),
};

export function sortElements({ container, item, indicators }) {
  const $container = _el(container);
  if (!$container) {
    console.warn('sortElements: container not found.', container);
    return [];
  }

  const items = getElements(item, $container);
  const defaultOrder = 'auto-asc';

  const specs = [].concat(indicators ?? []).map(spec => {
    if (isString(spec) || isFn(spec)) return {
      order    : isFn(spec) ? spec : defaultOrder,
      selector : isFn(spec) ? null : spec 
    };
    if (isArray(spec)) return {
      order    : spec[1] || defaultOrder,
      selector : spec[0],
    };
    return { order: defaultOrder, ...spec };
  });

  if (specs.some(s => s.order === 'random')) {
    shuffle(items);
  } else {
    items.sort((a, b) => {
      for (const { selector, order } of specs) {
        const valA = getValue(selector ? getElement(selector, a) : a) ?? '';
        const valB = getValue(selector ? getElement(selector, b) : b) ?? '';

        let result;

        if (isFn(order)) {
          result = order(valA, valB, a, b);
        } else {
          const [mode, direction] = order.includes('-') ? order.split('-') : ['auto', order];
          result = (sortModes[mode] || sortModes.auto)(valA, valB);
          if (direction === 'desc') result *= -1;
        }

        if (result) return result;
      }
      return 0;
    });
  }

  $container.append(...items);   // reine Bewegung, kein Fragment nötig
  return items;
}
