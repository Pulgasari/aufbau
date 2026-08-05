// @aufbau/elements/core/utils.js

export const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();     

// elements/core/events.js

// non-enumerable, non-writable-by-accident definition, keeps the descriptor in one place
const define = (target, props) => {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  }
  return target;
};

const decorated = new WeakSet();

// the two primitives, everything else just resolves targets
export const on = (target, ...tlo) => {
  target.addEventListener(...tlo);
  return () => target.removeEventListener(...tlo);
};

export const off = (target, ...tlo) => {
  target.removeEventListener(...tlo);
  return target;
};

// attaches on/off to a single event target
export function decorate (target) {
  if (!target || decorated.has(target)) return target;
  decorated.add(target);

  return define(target, {
    on  (...args) { return on  (this, ...args); },
    off (...args) { return off (this, ...args); }
  });
}

// same api on a list, fans out to its members
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
