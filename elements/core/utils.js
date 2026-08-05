// @aufbau/elements/core/utils.js

export const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();     

// @aufbau/elements/core/events.js

// non-enumerable definition, keeps the descriptor boilerplate in one place
const define = (target, props) => {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  }
  return target;
};

// tracks decorated targets without writing a marker property onto them
const decorated = new WeakSet();

// :::::: PRIMITIVES ::::::::::::::::::::::::::::::::::::::::::::

/**
 * attaches a listener and returns its unsubscribe function.
 * this is the only place addEventListener is called.
 */
export const on = (target, type, listener, options) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
};

/**
 * removes a listener. needs the exact same reference and capture flag,
 * the unsubscribe returned by on() is the reliable way.
 */
export const off = (target, type, listener, options) => {
  target.removeEventListener(type, listener, options);
  return target;
};

// :::::: DECORATION ::::::::::::::::::::::::::::::::::::::::::::

/**
 * attaches on/off to a single event target. idempotent.
 * @param {EventTarget} target
 */
export function decorate (target) {
  if (!target || decorated.has(target)) return target;
  decorated.add(target);

  return define(target, {
    on  (...args) { return on  (this, ...args); },
    off (...args) { return off (this, ...args); }
  });
}

/**
 * same api on a list, fans out to its members.
 * no weakset needed, $$() returns a fresh array on every call.
 * @param {Element[]} list
 */
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
