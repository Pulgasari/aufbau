// @aufbau/store/persist.js
// persistence adapters and per-key wiring. no imported store helper: `persist`
// takes a native Storage (localStorage/sessionStorage), a short name
// ('local'/'session'/'memory'/'none'), or any { get, set, subscribe? } object.
// storage is per-key granular: each leaf persists under `${key}:${leaf}`, so a
// write touches only the changed key and hydration is independent per leaf.

import { effect } from './reactive.js';

const encode = value => JSON.stringify(value);
const decode = raw   => { try { return JSON.parse(raw); } catch { return undefined; } };

const NONE = { get: () => undefined, set: () => {} };

// wraps a web Storage (getItem/setItem), turning a miss into `undefined`
function webAdapter (storage) {
  return {
    get : key          => { const raw = storage.getItem(key); return raw == null ? undefined : decode(raw); },
    set : (key, value) => storage.setItem(key, encode(value)),
    subscribe: storage === globalThis.localStorage
      ? (key, cb) => {
          const handler = event => { if (event.key === key && event.newValue != null) cb(decode(event.newValue)); };
          addEventListener('storage', handler);
          return () => removeEventListener('storage', handler);
        }
      : undefined,
  };
}

function memoryAdapter () {
  const map = new Map;
  return { get: key => (map.has(key) ? map.get(key) : undefined), set: (key, value) => map.set(key, value) };
}

// resolves the `persist` option to a { get, set, subscribe? } adapter
export function resolvePersist (persist) {
  if (!persist || persist === 'none') return NONE;
  if (persist === 'memory')  return memoryAdapter();
  if (persist === 'local')   return webAdapter(globalThis.localStorage);
  if (persist === 'session') return webAdapter(globalThis.sessionStorage);
  if (typeof persist === 'string') throw new Error(`[@aufbau/store] unknown persist "${persist}" (use 'local' | 'session' | 'memory' | 'none', a Storage, or { get, set })`);
  if (typeof persist.getItem === 'function') return webAdapter(persist);            // a native Storage passed directly
  if (typeof persist.get === 'function')     return persist;                        // a custom { get, set }
  throw new Error('[@aufbau/store] persist must be a Storage, a name, or { get, set }');
}

// hydrates one leaf from storage, then writes it back on change. hydration runs
// first and is skipped by the write-back, so a stored value never gets clobbered
// by the seed and an untouched seed is never written. returns a readiness promise
// (adapters may return a promise from get()).
export function persistKey (adapter, key, carrier) {
  const saved   = adapter.get(key);
  let   live    = false;
  const hydrate = value => { if (value !== undefined) carrier.set(value); live = true; };

  const ready = saved && typeof saved.then === 'function'
    ? saved.then(hydrate)
    : (hydrate(saved), Promise.resolve());

  let first = true;
  const dispose = effect(() => {
    const value = carrier.get();
    if (first) { first = false; return; }   // seed/hydration value is already stored
    if (live) adapter.set(key, value);
  });

  const off = adapter.subscribe?.(key, value => { if (value !== undefined) carrier.set(value); });

  return { ready, dispose: () => { dispose(); off?.(); } };
}
