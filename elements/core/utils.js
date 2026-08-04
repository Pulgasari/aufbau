// @aufbau/elements/core/utils.js

export const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();     

export const decorateElement = (el) => {
  if (!el || el._aufbauDecorated) return el;

  Object.defineProperties(el, {
    _aufbauDecorated: { value: true, configurable: true },
    on: {
      value (...args) {
        this.addEventListener(...args);
        return () => this.removeEventListener(...args);
      },
      writable: true, configurable: true
    },
    off: {
      value (...args) {
        this.removeEventListener(...args);
        return this;
      },
      writable: true, configurable: true
    }
  });

  return el;
};

export const decorateArray = (arr) => {
  Object.defineProperties(arr, {
    on: {
      value (...args) {
        const unsubs = this.map(el => el.on?.(...args) ?? (() => {}));
        return () => unsubs.forEach(unsub => unsub());
      },
      writable: true, configurable: true
    },
    off: {
      value (...args) {
        this.forEach(el => el.off?.(...args));
        return this;
      },
      writable: true, configurable: true
    }
  });

  return arr;
};
