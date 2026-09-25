// @aufbau/signals/persistence.js

import { createStorage, isFn } from './shared.js';

const MISS   = Symbol('miss');
const decode = raw   => { try { return JSON.parse(raw); } catch { return undefined; } };
const encode = value => JSON.stringify(value);

// :::::: WEB STORES

const webStore = (storage, { sync = true } = {}) => ({
  get : key          => decode(storage.getItem(key)) ?? undefined,
  set : (key, value) => storage.setItem(key, encode(value)),

  // cross-tab sync (for localStorage)
  subscribe: sync && storage === globalThis.localStorage
    ? (key, callback) => {
        let handler = event => { if (event.key === key && event.newValue !== null) callback(decode(event.newValue)); };
        addEventListener('storage', handler);
        return () => removeEventListener('storage', handler);
      }
    : undefined,
});

const cookie = ({ days = 365, path = '/' } = {}) => ({
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

const
local   = options => webStore(globalThis.localStorage,   options),
session = options => webStore(globalThis.sessionStorage, options),
none    = ()      => ({ get: () => undefined, set: () => {} });

// :::::: FOR AUFBAU

const aufbauStorage = createStorage({ area: 'local', namespace: 'aufbau', version: 1 });
const aufbauStore = () => ({
  get : key        => { let value = aufbauStorage.getSync(key, MISS); return value === MISS ? undefined : value; },
  set : (key, val) => aufbauStorage.setSync(key, val),
});

// accepts both `store: local` and `store: cookie({ days: 7 })`
const resolveStore = store => isFn(store) ? store() : (store ?? none());

// :::::: EXPORT

export {
  cookie, local, session, none,
  aufbauStore, resolveStore,
};
