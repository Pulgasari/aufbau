// @aufbau/signals/persistence.js
// stores for `signal({ key, store })`. every store is `(options?) => { get, set, subscribe? }`.
// get() may return a value or a promise — hydration handles both. a miss must read as
// `undefined`: that is the one value the factory treats as "nothing stored", so the
// declared default survives.

import { createStorage, isFn } from './shared.js';

let decode = raw   => { try { return JSON.parse(raw); } catch { return undefined; } };
let encode = value => JSON.stringify(value);

// :::::: WEB STORES

let webStore = (storage, { sync = true } = {}) => ({
  get : key          => decode(storage.getItem(key)) ?? undefined,
  set : (key, value) => storage.setItem(key, encode(value)),

  // cross-tab sync only fires for localStorage — sessionStorage is per-tab by design
  subscribe: sync && storage === globalThis.localStorage
    ? (key, callback) => {
        let handler = event => { if (event.key === key && event.newValue !== null) callback(decode(event.newValue)); };
        addEventListener('storage', handler);
        return () => removeEventListener('storage', handler);
      }
    : undefined,
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
  },
});

export let local   = options => webStore(globalThis.localStorage,   options);
export let session = options => webStore(globalThis.sessionStorage, options);
export let none    = ()      => ({ get: () => undefined, set: () => {} });

// aufbau-namespaced store over @bunker/storage (namespace + version + quota fallback).
// getSync's null fallback cannot express a miss, so a sentinel maps a miss back to
// `undefined` — the value the factory reads as "nothing stored".
let aufbauStorage = createStorage({ area: 'local', namespace: 'aufbau', version: 1 });
let MISS          = Symbol('miss');

export let signalStore = () => ({
  get : key        => { let value = aufbauStorage.getSync(key, MISS); return value === MISS ? undefined : value; },
  set : (key, val) => aufbauStorage.setSync(key, val),
});

// accepts both `store: local` and `store: cookie({ days: 7 })`
export let resolveStore = store => isFn(store) ? store() : (store ?? none());
