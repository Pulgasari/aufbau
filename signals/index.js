// @aufbau/signals

// :::::: IMPORT

import { useEffect, useRef }                           from 'preact/hooks';
import { computed, effect, signal, Signal, useSignal } from '@preact/signals';
import { createStorage } from '@bunker/storage';

import { isBool, isFn, isNumber } from '@pulgasari/is';

import { makeMap, makeSet } from './make.js';

// TODO: should `values` also apply to leaves inside a deep object?
//       e.g. deep: { size: ['s','m','l'] } — structure carrying both. undecided.
// TODO: back this with @bunker/db — the interface already allows an async get(), so
//       it can be added without touching anything else here.

// :::::: obj (objekt helfer util in the making, wie ich bereits 'str' habe)

const obj = {};

obj.getValueByDotKey = (object, dotKey) => {
  let parts  = dotKey.split('.');
  let last   = parts.pop(); // mutates parts -> prefix path, last -> leaf key
  let target = parts.reduce((node, k) => node[k], object);
  return target[last];
}
obj.toggleByDotKey   = (object, dotKey) => {
  let parts  = dotKey.split('.');
  let last   = parts.pop(); // mutates parts -> prefix path, last -> leaf key
  let target = parts.reduce((node, k) => node[k], object);
  let value  = target[last];
          
  target[last] = isBool(value)   ? !value
               : value === 'on'  ? 'off'
               : value === 'off' ? 'on' 
               : value;
};

// :::::: HELPERS

let isAbort       = error => error?.name === 'AbortError';
let isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
let isPromise     = value => value !== null && typeof value?.then === 'function';
//let isNode        = value => value !== null && typeof value === 'object' && _meta.has(value);

/*
let isObject      = value => value !== null && typeof value === 'object';
let isPlainObject = value => isObject(value) && (value.constructor === Object || !value.constructor);
let isPromise     = value => isObject(value) && typeof value.then === 'function';
let isNode        = value => isObject(value) && _meta.has(value);
*/

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


// :::::: DEEP SIGNALS
// each leaf property is an independent signal — mutations stay scoped

let _leaves = new WeakSet;
let _meta   = new WeakMap;

let isLeaf = value => _leaves.has(value);
let isNode = value => value !== null && typeof value === 'object' && _meta.has(value);

// deep spec: true = unlimited, number = remaining levels, object = explicit shape
let descend = (spec, key) =>
    spec === true       ? true
  : isNumber(spec)      ? spec - 1
  : isPlainObject(spec) ? (spec[key] ?? false)
  : false;

let _makeLeaf = value => {
  let leaf = signal(value);
  _leaves.add(leaf);
  return leaf;
};
let _spawn = (value, spec) => spec && isPlainObject(value) ? _makeNode(value, spec) : _makeLeaf(value);

// reactive=true  -> tracks every descendant signal (for effect/computed)
// reactive=false -> peek only, no subscriptions created
let _raw = ({ children, keysSignal }, reactive) => {
  if (reactive) void keysSignal.value;
  let out = {};
  for (let [key, child] of children)
    out[key] = isLeaf(child)
      ? (reactive ? child.value : child.peek())
      : _raw(_meta.get(child), reactive);
  return out;
};

let _makeNode = (object, spec = true) => {
  let children   = new Map;
  let keysSignal = signal(Object.keys(object));
  let syncKeys   = () => { keysSignal.value = [...children.keys()]; };
  let meta       = { children, keysSignal, syncKeys, ready: null, sig: null, spec };

  

  for (let key of keysSignal.peek())
    children.set(key, _spawn(object[key], descend(spec, key)));

  let proxy = new Proxy({}, {
    get (_, key) {
      if (typeof key === 'symbol') return undefined;

      switch (key) {
        case '$keys'   : return keysSignal.value;
        case '$peek'   : return () => _raw(meta, false);
        case '$raw'    : return _raw(meta, true);
        case '$ready'  : return meta.ready;
        case '$signal' : return meta.sig ??= computed(() => _raw(meta, true));
        case '$toggle' : return (dotKey) => obj.toggleByDotKey(proxy, dotKey);
        case '$update' : return patch => {
          for (let [k, v] of Object.entries(patch))
            isPlainObject(v) && isNode(children.get(k)) ? proxy[k].$update(v) : proxy[k] = v;
        };
        
      }

      let child = children.get(key);
      if (child === undefined) return undefined;
      return isLeaf(child) ? child.value : child;
    },

    set (_, key, value) {
      if (typeof key === 'symbol') return true;

      let child = children.get(key);

      if (child !== undefined) {
        if (isLeaf(child) && !isPlainObject(value)) { child.value = value; return true; } // scalar->scalar: minimal blast radius
        if (isNode(child) &&  isPlainObject(value)) { _merge(child, value); return true; } // object->object: deep merge, preserves signals
        // type changed (scalar<->object): replace — old consumers stop updating, correct by design
      }

      children.set(key, _spawn(value, descend(spec, key)));
      if (child === undefined) syncKeys();
      return true;
    },

    deleteProperty (_, key) {
      if (children.delete(key)) syncKeys();
      return true;
    },

    has     (_, key) { return children.has(key); },
    ownKeys (_)      { void keysSignal.value; return [...children.keys()]; },
    getOwnPropertyDescriptor (_, key) {
      return children.has(key)
        ? { configurable: true, enumerable: true, writable: true }
        : undefined;
    },
  });

  _meta.set(proxy, meta);
  return proxy;
};

let _merge = (proxy, object) => {
  let changedKeys = false;
  let { children, syncKeys } = _meta.get(proxy);
  let keys = new Set(Object.keys(object));
  for (let key of keys) proxy[key] = object[key];
  for (let key of children.keys()) {
    if (!keys.has(key)) {
      children.delete(key);
      changedKeys = true;
    }
  }
  if (changedKeys) syncKeys(); // Trigger signal exactly once
};


// ====== scalar signal with allowed values =========================

class XSignal extends Signal {
  constructor (value, values) {
    super(value);
    this.$ready  = null;
    this.$values = values ?? null;
  }
  get value () { return super.value; }
  set value (next) {
    if (this.$values && !this.$values.includes(next))
      return void console.warn(`[x] ignored "${next}" — not in [${this.$values}]`);
    super.value = next;
  }
  // steps to the next allowed value and wraps around — a two-value list is a toggle
  cycle () {
    if (!this.$values) return this.peek();
    let index = this.$values.indexOf(this.peek());
    super.value = this.$values[(index + 1) % this.$values.length];
    return this.peek();
  }
}


// ====== betterSignal ==============================================
// a plain object argument is ALWAYS config — wrap real object values in { value }

export let betterSignal = input => {
  let config = isPlainObject(input) ? input : { value: input };
  let { deep = false, key, type, value, values } = config;
  let store  = resolveStore(config.store);

  // pick the carrier and expose a uniform read/write pair for persistence
  let target =
      type === Map ? (target => ({ target, read: () => target.toObject(),    write: saved => target.replace(saved) }))(makeMap(value))
    : type === Set ? (target => ({ target, read: () => target.toArray(),     write: saved => target.replace(saved) }))(makeSet(value))
    : deep         ? (target => ({ target, read: () => target.$signal.value, write: saved => _merge(target, saved) }))(_makeNode(value ?? {}, deep))
    :                (target => ({ target, read: () => target.value,         write: saved => { target.$values = null; target.value = saved; target.$values = values ?? null; } }))(new XSignal(value, values));

  if (!key) return target.target;

  // hydrate first, persist afterwards — never write the initial value back over stored data
  let live  = false;
  let saved = store.get(key);
  let apply = loaded => { if (loaded !== undefined) target.write(loaded); };

  let ready = isPromise(saved)
    ? saved.then(loaded => { apply(loaded); live = true; })
    : (apply(saved), live = true, Promise.resolve());

  effect(() => { let snapshot = target.read(); if (live) store.set(key, snapshot); });
  store.subscribe?.(key, loaded => apply(loaded));

  if (target.target instanceof XSignal) target.target.$ready = ready;
  else if (_meta.has(target.target))    _meta.get(target.target).ready = ready;
  else                                  Object.defineProperty(target.target, '$ready', { get: () => ready });

  return target.target;
};



// :::::: EXPORT

export * from './fetchers.js';
export * from './hooks.js';
export * from './make.js';

export * from './querySignal.js';





/*
function deleteKeyFromSignalObject(signal, key) {
  const { [key]: _, ...rest } = signal.value;  // destructuring + rest
  signal.value = rest;
}

// oder explizit mit delete (wie im Original)
function deleteKeyFromSignalObject(signal, key) {
  const copy = { ...signal.value };
  delete copy[key];
  signal.value = copy;
}

function setSignalObject(signal, key, value) {
  signal.value = { ...signal.value, [key]: value };
}

// Verwendung:
setSignalObject(this._perms, id, 'granted');
setSignalObject(this._scanning, id, true);

function removeFromSignalObjectListByPredicate(signal, predicate) {
  signal.value = signal.value.filter(item => !predicate(item));
}

// Entfernt Elemente, bei denen ALLE Kriterien erfüllt sind (AND)
function removeFromSignalObjectListByCriteria(signal, criteria) {
  signal.value = signal.value.filter(item =>
    !Object.keys(criteria).every(key => item[key] === criteria[key])
  );
}

// Entfernt Elemente, bei denen MINDESTENS EIN Kriterium erfüllt ist (OR)
function removeFromSignalObjectListByAnyCriteria(signal, criteria) {
  signal.value = signal.value.filter(item =>
    !Object.keys(criteria).some(key => item[key] === criteria[key])
  );
}

function removeFromSignalObjectListByCriteria (signal, criteria) {
  signal.value = signal.value.filter(item =>
    !Object.keys(criteria).every(key => {
      const criterion = criteria[key];
      return typeof criterion === 'function'
        ? criterion(item[key])
        : item[key] === criterion;
    })
  );
}
*/

/*
let createTarget = ({ type, deep, value, values }) => {
  if (type === Map) {
    let target = makeMap(value);
    return {
      target,
      read: () => target.toObject(),
      write: saved => target.replace(saved),
    };
  }

  if (type === Set) {
    let target = makeSet(value);
    return {
      target,
      read: () => target.toArray(),
      write: saved => target.replace(saved),
    };
  }

  if (deep) {
    let target = _makeNode(value ?? {}, deep);
    return {
      target,
      read: () => target.$signal.value,
      write: saved => _merge(target, saved),
    };
  }

  let target = new XSignal(value, values);

  return {
    target,
    read: () => target.value,
    write: saved => {
      target.$values = null;
      target.value = saved;
      target.$values = values ?? null;
    },
  };
};
*/

/*
export const betterSignal = input => {
  const config = isPlainObject(input) ? input : { value: input };
  const target = createTarget(config);
  const store  = resolveStore(config.store);

  if (config.key == null) return target.value;

  attachPersistence (target, store, config.key);
  return target.value;
};

const createTarget = ({ type, deep, value, values }) => {
  if (type === Map) return createMapTarget    (value);
  if (type === Set) return createSetTarget    (value);
  if (deep)         return createDeepTarget   (value, deep);
                    return createScalarTarget (value, values);
};
*/
/*
const attachPersistence = (target, store, key) => {
  let live  = false;
  let saved = store.get(key);

  const apply = value => {
    if (value !== undefined) target.write(value);
  };

  const ready = isPromiseLike (saved)
    ? saved.then (value => { apply(value); live = true; })
    : (() => { apply(saved); live = true; return Promise.resolve(); })();

  effect(() => {
    target.read();
    if (live) store.set(key, target.read());
  });

  store.subscribe?.(key, apply);

  target.setReady(ready);
};
*/
