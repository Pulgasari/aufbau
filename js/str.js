// Custom utility methods accepting target string as the first parameter
const utils = {
  startsWith(val, ...prefixes) {
    const s = String(val ?? '');
    return prefixes.some((prefix) => s.startsWith(prefix));
  },

  endsWith(val, ...suffixes) {
    const s = String(val ?? '');
    return suffixes.some((suffix) => s.endsWith(suffix));
  },

  toTitleCase(val) {
    const s = String(val ?? '');
    return s
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[-_]+/g, ' ')
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  }
};

/**
 * Creates a dual-use string utility supporting both chainable str(val) calls
 * and static str.method(val) execution.
 */
export const str = Object.assign(
  function str(val) {
    const s = String(val ?? '');

    return new Proxy({}, {
      get(_, prop) {
        if (prop === 'toString' || prop === 'valueOf') {
          return () => s;
        }
        if (prop in utils) {
          return (...args) => utils[prop](s, ...args);
        }
        const nativeAttr = s[prop];
        return typeof nativeAttr === 'function' ? nativeAttr.bind(s) : nativeAttr;
      }
    });
  },
  utils
);
