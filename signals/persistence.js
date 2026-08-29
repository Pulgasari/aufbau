// @aufbau/signals/persistence.js

let decode = raw   => { try { return JSON.parse(raw); } catch { return undefined; }};
let encode = value => JSON.stringify(value);

// :::::: STORES
// every store is `(options?) => { get, set, subscribe? }`
// get() may return a value or a promise — hydration handles both

let webStore = (storage, { sync = true } = {}) => ({
  get : (key)        => decode(storage.getItem(key)) ?? undefined,
  set : (key, value) => storage.setItem(key, encode(value)),
  
  subscribe: sync && storage === globalThis.localStorage
    ? (key, callback) => {
        let handler = event => { if (event.key === key && event.newValue !== null) callback(decode(event.newValue)); };
        addEventListener('storage', handler);
        return () => removeEventListener('storage', handler);
      }
    : undefined
});

export let cookie = ({ days = 365, path = '/' } = {}) => ({
  get (key) {
    let match = `; ${document.cookie}`.split(`; ${key}=`);
    if (match.length !== 2) return undefined;
    return decode(decodeURIComponent(match.pop().split(';').shift()));
  },
  set (key, value) {
    let expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(encode(value))};expires=${expires};path=${path}`;
  }
});
export let local   = (options) => webStore(globalThis.localStorage,   options);
export let session = (options) => webStore(globalThis.sessionStorage, options);
export let none    = ()        => ({ get: () => undefined, set: () => {} });

// aufbau-namespaced store over @bunker/storage (namespace + version + quota
// fallback), for `betterSignal({ store: signalStore, key })`. a miss must read as
// undefined — the one value betterSignal takes as "nothing stored" so the declared
// default survives — hence the sentinel over getSync's null fallback.
let _aufbauStorage = createStorage({ area: 'local', namespace: 'aufbau', version: 1 });
let MISS_STORE     = Symbol('miss');
export let signalStore = () => ({
  get: key        => { let value = _aufbauStorage.getSync(key, MISS_STORE); return value === MISS_STORE ? undefined : value; },
  set: (key, val) => _aufbauStorage.setSync(key, val),
});

// accepts both `store: local` and `store: cookie({ days: 7 })`
let resolveStore = store => isFn(store) ? store() : (store ?? none());
