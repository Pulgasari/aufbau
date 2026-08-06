// @aufbau/js/memo.js

export const lazy = (factory) => {
  let called = false;
  let value;

  const resolve = () => {
    if (!called) {
      called = true;
      value  = factory();
    }
    return value;
  };

  resolve.clear = () => { called = false; value = undefined; };
  return resolve;
};

export const lru = (max = 100) => {
  const store = new Map;

  return {
    get size () { return store.size; },
    clear  : ()  => store.clear  (),
    delete : key => store.delete (key),
    has    : key => store.has    (key),
    keys   : ()  => store.keys   (),

    get (key) {
      if (!store.has(key)) return undefined;
      const value = store.get(key);
      store.delete(key);
      store.set(key, value);
      return value;
    },

    set (key, value) {
      if (store.has(key)) store.delete(key);
      else if (store.size >= max) store.delete(store.keys().next().value);
      store.set(key, value);
      return value;
    }
  };
};

export const memoize = (callback, { key = (...args) => args[0], max = 0 } = {}) => {
  const store = max > 0 ? lru(max) : new Map;

  const memoized = (...args) => {
    const cacheKey = key(...args);
    if (store.has(cacheKey)) return store.get(cacheKey);

    const value = callback(...args);
    store.set(cacheKey, value);
    if (value instanceof Promise) value.catch(() => store.delete(cacheKey));
    return value;
  };

  memoized.cache = store;
  memoized.clear = () => store.clear();
  return memoized;
};
