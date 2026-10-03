import { offEvent } from '@domina/methods/offEvent.js';
import { onEvent }  from '@domina/methods/onEvent.js';

export const arrayfied = value => Array.isArray(value) ? value : [value];

const define = (target, props) => {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  }
  return target;
};

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

export function dedent (text) {
  const [first, ...rest] = String(text ?? '').replace(/\t/g, '  ').split('\n');

  const filled = rest.filter(line => line.trim());
  const indent = filled.length ? Math.min(...filled.map(line => line.match(/^ */)[0].length)) : 0;

  return [first.trimStart(), ...rest.map(line => line.slice(indent))].join('\n').replace(/^\s*\n/, '').trimEnd();
}
