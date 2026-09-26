// @aufbau/elements/core/utils.js

import { offEvent } from '@domina/methods/offEvent.js';
import { onEvent }  from '@domina/methods/onEvent.js';

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
    on  (...args) { return onEvent  (this, ...args); },
    off (...args) { return offEvent (this, ...args); }
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




// :::::: TEXT ::::::::::::::::::::::::::::::::::::::::::::::::::

/**
 * strips the indentation all non-empty lines share, plus leading and trailing
 * blank lines. source written inside indented html would otherwise turn every
 * markdown paragraph into a code block and shift every line of code.
 */
export function dedent (text) {
  const [first, ...rest] = String(text ?? '').replace(/\t/g, '  ').split('\n');

  // text right after the opening tag starts at column 0 whatever the markup's
  // indent, so only the lines after it tell how far the source is indented
  const filled = rest.filter(line => line.trim());
  const indent = filled.length ? Math.min(...filled.map(line => line.match(/^ */)[0].length)) : 0;

  return [first.trimStart(), ...rest.map(line => line.slice(indent))].join('\n').replace(/^\s*\n/, '').trimEnd();
}
