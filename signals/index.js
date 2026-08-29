// @aufbau/signals

// :::::: IMPORT

import { useEffect, useRef }                           from 'preact/hooks';
import { computed, effect, signal, Signal, useSignal } from '@preact/signals';
import { createStorage } from '@bunker/storage';

import { isFn, isNumber } from '@pulgasari/is';

// TODO: should `values` also apply to leaves inside a deep object?
//       e.g. deep: { size: ['s','m','l'] } — structure carrying both. undecided.
// TODO: back this with @bunker/db — the interface already allows an async get(), so
//       it can be added without touching anything else here.


// :::::: HELPERS

let isAbort       = error => error?.name === 'AbortError';
let isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
let isPromise     = value => value !== null && typeof value?.then === 'function';

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
  let meta       = { children, keysSignal, ready: null, sig: null, spec };

  for (let key of keysSignal.peek())
    children.set(key, _spawn(object[key], descend(spec, key)));

  let proxy = new Proxy({}, {
    get (_, key) {
      if (typeof key === 'symbol') return undefined;

      switch (key) {
        case '$keys'  : return keysSignal.value;
        case '$peek'  : return () => _raw(meta, false);
        case '$raw'   : return _raw(meta, true);
        case '$ready' : return meta.ready;
        case '$signal': {
          if (!meta.sig) meta.sig = computed(() => _raw(meta, true)); // lazy — only pay when needed
          return meta.sig;
        }
        case '$update': return patch => {
          for (let [k, v] of Object.entries(patch))
            isPlainObject(v) && isNode(children.get(k)) ? proxy[k].$update(v) : proxy[k] = v;
        };
        case '$toggle': return dotKey => {
          let parts  = dotKey.split('.');
          let last   = parts.pop(); // mutates parts -> prefix path, last -> leaf key
          let target = parts.reduce((node, k) => node[k], proxy);
          let value  = target[last];
          target[last] = typeof value === 'boolean' ? !value
                       : value === 'on'             ? 'off'
                       : value === 'off'            ? 'on' : value;
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
      if (child === undefined) keysSignal.value = [...keysSignal.peek(), key];
      return true;
    },

    deleteProperty (_, key) {
      if (children.has(key)) {
        children.delete(key);
        keysSignal.value = keysSignal.peek().filter(k => k !== key);
      }
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
  let { children } = _meta.get(proxy);
  let keys = new Set(Object.keys(object));
  for (let key of keys)            proxy[key] = object[key];
  for (let key of children.keys()) if (!keys.has(key)) delete proxy[key];
};


// ====== map / set collections =====================================

let makeMap = (init = []) => {
  let sig    = signal(new Map(Array.isArray(init) ? init : Object.entries(init)));
  let mutate = fn => { let next = new Map(sig.peek()); fn(next); sig.value = next; };

  return {
    get $ready  () { return null; },
    get $signal () { return sig; },
    get size    () { return sig.value.size; },
    
    clear    : ()           => sig.value = new Map,
    delete   : key          => mutate(map => map.delete(key)),
    entries  : ()           => sig.value.entries(),
    forEach  : callback     => sig.value.forEach(callback),
    get      : key          => sig.value.get(key),
    has      : key          => sig.value.has(key),
    keys     : ()           => sig.value.keys(),
    replace  : source       => sig.value = new Map(Array.isArray(source) ? source : Object.entries(source)),
    set      : (key, value) => mutate(map => map.set(key, value)),
    toArray  : ()           => [...sig.value.entries()],
    toObject : ()           => Object.fromEntries(sig.value),
    values   : ()           => sig.value.values(),
    
    [Symbol.iterator] () { return sig.value[Symbol.iterator](); },
  };
};

let makeSet = (init = []) => {
  let sig    = signal(new Set(init));
  let mutate = fn => { let next = new Set(sig.peek()); fn(next); sig.value = next; };

  return {
    get $ready  () { return null; },
    get $signal () { return sig; },
    get size    () { return sig.value.size; },
    
    add      : value    => mutate(set => set.add(value)),
    clear    : ()       => sig.value = new Set,
    delete   : value    => mutate(set => set.delete(value)),
    forEach  : callback => sig.value.forEach(callback),
    has      : value    => sig.value.has(value),
    replace  : source   => sig.value = new Set(source),
    toArray  : ()       => [...sig.value],
    toggle   : value    => mutate(set => set.has(value) ? set.delete(value) : set.add(value)),
    values   : ()       => sig.value.values(),
    
    [Symbol.iterator] () { return sig.value[Symbol.iterator](); },
  };
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


// ====== querySignal ===============================================

let emptyState = (pending, fetching) => ({
  data               : null,
  error              : null,
  hasNextPage        : true,
  isFetching         : fetching,
  isFetchingNextPage : false,
  isPending          : pending,
  pages              : [],
});

export let querySignal = (fetcher, options = {}) => {
  let { deps, enabled = true, infinite = false, limit = 100, prefetch = false } = options;

  let state = signal(emptyState(true, true));

  let cached      = null; // pre-fetched page, waiting to be consumed
  let controller  = null;
  let hasMore     = true; // the actual truth from the last response
  let page        = 1;
  let prefetching = null;
  let token       = 0;    // guards against out-of-order responses

  let abort   = () => { controller?.abort(); controller = new AbortController; return controller.signal; };
  let flatten = pages => pages.flat();

  // arrays fall back to the limit heuristic, objects can be explicit
  let normalize = result => {
    if (Array.isArray(result)) return { items: result, hasMore: result.length === limit };
    let items = result?.items ?? [];
    return { items, hasMore: result?.hasMore ?? items.length === limit };
  };

  async function prefetchNext (runToken) {
    if (prefetching || !hasMore) return;
    prefetching = fetcher({ page: page + 1, signal: controller.signal })
      .then(result => {
        if (runToken !== token) return;
        let next = normalize(result);
        cached  = next.items;
        hasMore = next.hasMore;
      })
      .catch(() => { cached = null; }) // let the regular path retry later
      .finally(() => { if (runToken === token) prefetching = null; });
  }

  async function load (runToken) {
    let abortSignal = abort();
    try {
      let result = await fetcher({ page: 1, signal: abortSignal });
      if (runToken !== token) return;

      if (!infinite) {
        state.value = { ...emptyState(false, false), data: result };
        return;
      }
      let { items, hasMore: more } = normalize(result);
      hasMore = more;
      state.value = { ...emptyState(false, false), data: flatten([items]), hasNextPage: more, pages: [items] };
      if (prefetch && more) prefetchNext(runToken);
    } catch (error) {
      if (runToken !== token || isAbort(error)) return;
      state.value = { ...state.peek(), error, isFetching: false, isFetchingNextPage: false, isPending: false };
    }
  }

  async function fetchNextPage () {
    let current = state.peek();
    if (!infinite || !current.hasNextPage || current.isFetchingNextPage) return;

    let runToken = token;

    // the user scrolled faster than the background fetch — wait for it
    if (prefetching) {
      state.value = { ...current, isFetching: true, isFetchingNextPage: true };
      await prefetching;
      if (runToken !== token) return;
    }

    if (cached !== null) {
      let items = cached;
      cached = null;
      page++;
      let previous = state.peek();
      let pages    = [...previous.pages, items];
      state.value  = { ...previous, data: flatten(pages), hasNextPage: hasMore, isFetching: false, isFetchingNextPage: false, pages };
      if (prefetch && hasMore) prefetchNext(runToken);
      return;
    }

    state.value = { ...state.peek(), isFetching: true, isFetchingNextPage: true };
    try {
      let result = await fetcher({ page: page + 1, signal: controller.signal });
      if (runToken !== token) return;

      let { items, hasMore: more } = normalize(result);
      page++;
      hasMore = more;
      let previous = state.peek();
      let pages    = [...previous.pages, items];
      state.value  = { ...previous, data: flatten(pages), hasNextPage: more, isFetching: false, isFetchingNextPage: false, pages };
      if (prefetch && more) prefetchNext(runToken);
    } catch (error) {
      if (runToken !== token || isAbort(error)) return;
      state.value = { ...state.peek(), error, isFetching: false, isFetchingNextPage: false };
    }
  }

  function start () {
    token++;
    cached      = null;
    hasMore     = true;
    page        = 1;
    prefetching = null;
    return token;
  }

  effect(() => {
    deps?.(); // read explicitly — anything after an await in the fetcher is NOT tracked
    let on = typeof enabled === 'function' ? enabled() : enabled;

    let runToken = start();
    state.value  = emptyState(true, on);
    if (on) load(runToken);
    else controller?.abort();
  });

  state.fetchNextPage = fetchNextPage;
  state.refetch       = () => { let runToken = start(); state.value = emptyState(true, true); return load(runToken); };

  return state;
};


// ====== fake data =================================================

export let fakeFetcher = ({ delay = 300, fail = 0, limit = 20, total = 200 } = {}) =>
  ({ page = 1 } = {}) => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < fail) return reject(new Error('fakeFetcher: simulated failure'));
      let start = (page - 1) * limit;
      let count = Math.max(0, Math.min(limit, total - start));
      let items = Array.from({ length: count }, (_, i) => ({ id: start + i + 1, title: `item ${start + i + 1}` }));
      resolve({ items, hasMore: start + count < total });
    }, delay);
  });

export let dummyFetcher = (resource = 'products', { delay = 0, limit = 20 } = {}) =>
  async ({ page = 1, signal: abortSignal } = {}) => {
    let skip     = (page - 1) * limit;
    let response = await fetch(`https://dummyjson.com/${resource}?limit=${limit}&skip=${skip}&delay=${delay}`, { signal: abortSignal });
    let data     = await response.json();
    let items    = data[resource] ?? [];
    return { items, hasMore: skip + items.length < data.total };
  };


// :::::: EXPORT

export * from './hooks.js';



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
*/
