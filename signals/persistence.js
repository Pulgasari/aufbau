// @aufbau/signals/persistence.js
// where a signal persists, and the wiring that keeps it there.

import { createStorage, effect, isFn, isPromise } from './shared.js';

const MISS   = Symbol('miss');
const decode = raw   => { try { return JSON.parse(raw); } catch { return undefined; } };
const encode = value => JSON.stringify(value);

// :::::: STORES
// a store is { get(key), set(key, value), subscribe?(key, callback) }. get may
// return a promise, the wiring below waits for it.

const webStore = (storage, { sync = true } = {}) => ({
  get : key          => storage.getItem(key) === null ? undefined : decode(storage.getItem(key)),
  set : (key, value) => storage.setItem(key, encode(value)),

  // other tabs writing the same key, localStorage only
  subscribe: sync && storage === globalThis.localStorage
    ? (key, callback) => {
        const handler = event => { if (event.key === key && event.newValue !== null) callback(decode(event.newValue)); };
        globalThis.addEventListener?.('storage', handler);
        return () => globalThis.removeEventListener?.('storage', handler);
      }
    : undefined,
});

const cookie = ({ days = 365, path = '/' } = {}) => ({
  get (key) {
    const match = `; ${document.cookie}`.split(`; ${key}=`);
    if (match.length !== 2) return undefined;
    return decode(decodeURIComponent(match.pop().split(';').shift()));
  },
  set (key, value) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${key}=${encodeURIComponent(encode(value))};expires=${expires};path=${path}`;
  },
});

const
local   = options => webStore(globalThis.localStorage,   options),
session = options => webStore(globalThis.sessionStorage, options),
none    = ()      => ({ get: () => undefined, set: () => {} });

// localStorage under the aufbau namespace, through @bunker/storage
let aufbauStorage = null;
const aufbauStore = () => {
  aufbauStorage ??= createStorage({ area: 'local', namespace: 'aufbau', version: 1 });
  return {
    get : key          => { const value = aufbauStorage.getSync(key, MISS); return value === MISS ? undefined : value; },
    set : (key, value) => aufbauStorage.setSync(key, value),
  };
};

const BY_NAME = { aufbau: aufbauStore, cookie, local, none, session };

const isWebStorage = value => typeof value?.getItem === 'function' && typeof value?.setItem === 'function';
const isStore      = value => typeof value?.get === 'function' && typeof value?.set === 'function';

/**
 * 'local' | 'session' | 'cookie' | 'aufbau' | 'none', localStorage or sessionStorage
 * themselves, a { get, set } store, or one of the factories above (local, cookie({ days }))
 */
function resolveStorage (storage) {
  if (storage == null)          return none();
  if (typeof storage === 'string') {
    const make = BY_NAME[storage.toLowerCase()];
    if (!make) throw new TypeError(`[aufbau/signals] unknown storage "${storage}", expected ${Object.keys(BY_NAME).join(', ')}`);
    return make();
  }
  if (isWebStorage(storage)) return webStore(storage);
  if (isStore(storage))      return storage;
  if (isFn(storage))         return resolveStorage(storage());
  throw new TypeError('[aufbau/signals] a storage is a name, a web storage or a { get, set } store');
}

// :::::: WIRING

// a Map or Set does not survive JSON, so it is stored as the shape it reads back from
const snapshotOf = value =>
    value instanceof Map ? Object.fromEntries(value)
  : value instanceof Set ? [...value]
  : value;

/**
 * hydrates `signal` from `key`, then writes every change back. the stored value
 * wins over the declared one, a key missing from storage keeps it. resolves once
 * hydration applied, which is also what signal.$ready holds afterwards.
 */
function persistSignal (signal, storage, key) {
  const store = resolveStorage(storage);

  // $restore, not .value: hydration is authoritative and may write past a type's
  // own validation (see EnumSignal)
  const apply = value => { if (value !== undefined) signal.$restore(value); };

  const arm = () => {
    let first = true;
    effect(() => {
      const value = signal.value;
      if (first) { first = false; return; }   // the hydrated or declared value is not written back
      store.set(key, snapshotOf(value));
    });
    store.subscribe?.(key, apply);
  };

  const saved = store.get(key);
  signal.$ready = isPromise(saved)
    ? saved.then(value => { apply(value); arm(); })
    : (apply(saved), arm(), Promise.resolve());

  return signal.$ready;
}

// :::::: EXPORT

export {
  aufbauStore, cookie, local, none, session,
  persistSignal, resolveStorage,
  resolveStorage as resolveStore,
};
