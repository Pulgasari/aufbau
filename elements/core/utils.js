// @aufbau/elements/core/utils.js

export const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();     

// elements/core/events.js

// the one primitive: bind a listener, return its unsubscribe
export const bind = (target, type, listener, options) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener, options);
};

// attaches on/off to any event target, idempotent and non-enumerable
export function decorate (target) {
  if (!target || target._aufbauDecorated) return target;

  Object.defineProperties(target, {
    _aufbauDecorated : { value: true, configurable: true },
    on  : { configurable: true, writable: true, value (...args) { return bind(this, ...args); } },      
    off : { configurable: true, writable: true, value (type, listener, options) {
      this.removeEventListener(type, listener, options);
      return this;
    } }
  });

  return target;
}

// same api on a list, fans out to the already decorated members
export function decorateAll (list) {
  const items = list.map(decorate);

  Object.defineProperties(items, {
    on  : { configurable: true, writable: true, value (...args) {
      const unsubs = items.map(item => item.on(...args));
      return () => unsubs.forEach(unsub => unsub());
    } },
    off : { configurable: true, writable: true, value (...args) {
      items.forEach(item => item.off(...args));
      return items;
    } }
  });

  return items;
}
