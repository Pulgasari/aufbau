// @aufbau/elements/core/utils.js

import * as dom from '@domina/core';
export { dom };

export const arrayfied = value => Array.isArray(value) ? value : [value];

// non-enumerable definition, keeps the descriptor boilerplate in one place
const define = (target, props) => {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  }
  return target;
};

// tracks decorated targets without writing a marker property onto them
const decorated = new WeakSet;

// :::::: DECORATION ::::::::::::::::::::::::::::::::::::::::::::

export function decorate (target) {
  if (!target || decorated.has(target)) return target;
  decorated.add(target);

  return define(target, {
    on  (...args) { return dom.onEvent  (this, ...args); },
    off (...args) { return dom.offEvent (this, ...args); }
  });
}

export function decorateAll (list) {
  const items = list.map(decorate);

  return define(items, {
    on (...args) {
      const unsubs = items.map(item => item.on(...args));
      return () => unsubs.forEach(unsub => unsub());
    },
    off (...args) {
      items.forEach(item => item.off(...args));
      return items;
    }
  });
}



