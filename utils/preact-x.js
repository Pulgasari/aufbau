// preact-x.js

/* === refactoring

(1) signalWithQuery, signalWithInfiniteQuery, signalWithOptimisticInfiniteQuery teilen sich viel logik 
- bzw könnten vermutlich eigtl aufeinander aufbauen?
- oder besser wäre vllt "infinite"und "optmisitc" wären options/variantenvon `signalWithQuery`?

(2) grundsätzlich wäre vermutlich besser es modularer zu machen mit kombi aus haupttyp + konfigurationen

- storedSignal
- signalWithQuery

- BunkerSignal
- MapSignal
- SetSignal


*/

import { useEffect, useRef } from 'preact/hooks';
import { computed, effect, signal, useSignal, useSignalEffect } from '@preact/signals';
import BunkerDB from './bunker.js';

// Internal Helpers
let isNullish   = v => v === undefined || v === null;
let isPlainObj  = v => v !== null && typeof v === 'object' && !Array.isArray(v);
let serialize   = value => typeof value === 'string' ? value : JSON.stringify(value);
let deserialize = value => { try { return JSON.parse(value); } catch { return value; }};
let deepClone   = v => JSON.parse(JSON.stringify(v));
let tryParse    = (v, fallback) => { try { return JSON.parse(v); } catch { return fallback; }};
let getCookie = name => {
  let value = `; ${document.cookie}`;
  let parts = value.split(`; ${name}=`);
  if (parts.length === 2) return deserialize(decodeURIComponent(parts.pop().split(";").shift()));
  return null;
};
let setCookie = (name, val, options={}) => {
  let { days = 7, path = '/' } = options;
  let d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(serialize(val))};expires=${d.toUTCString()};path=${path}`;
};

// ====== Signal ====================================================

// API: with Persistence
let createPersistentSignal = (storage, key, init, options = {}) => {
  let { syncTabs = true } = options;
  //
  let saved = storage.getItem(key);
  if (saved !== null) init = deserialize(saved);
  //
  let sig = signal(init);
  //
  effect(() => storage.setItem( key, serialize(sig.value) ));
  // Sync across tabs (only for localStorage)
  if (syncTabs && storage === window.localStorage) {
    window.addEventListener('storage', event => {
      if (event.key === key && event.newValue !== null) {
        let newVal = deserialize(event.newValue);
        if (serialize(sig.peek()) !== serialize(newVal)) sig.value = newVal;
      }
    });
  }
  // Done
  return sig;
};
export let signalWithStorage = (init, key, options) => createPersistentSignal( window.localStorage,   key, init, options);
export let signalWithSession = (init, key, options) => createPersistentSignal( window.sessionStorage, key, init, options);
export let signalWithCookie  = (init, key, options = {}) => {
  let { expires = 365, path = '/' } = options;
  let saved = getCookie(key);
  let sig   = signal(saved !== null ? saved : init);

  effect(() => setCookie(key, sig.value));
  return sig;
};

// Helper to wrap an existing signal with storage logic if needed.
export let persistSignal = (sig, storage, key) => {
  effect(() => storage.setItem( key, serialize(sig.value) ));
  return sig;
};

// API: with Query
export let signalWithQuery = fetcher => {
  let state = signal({ data: null, isPending: true, isError: false });

  effect(() => {
    let currentData = state.peek().data;
    state.value = { data: currentData, isPending: true, isError: false };
    
    fetcher()
    .then(data => state.value = { data, isPending: false, isError: false })
    .catch(error => state.value = { data: state.peek().data, isPending: false, isError: true });
  });

  return state;
};
export let signalWithInfiniteQuery = (fetcher, { limit = 100 }={}) => {
  let state = signal({ 
    pages: [], 
    isPending: true, 
    isFetchingNextPage: false, 
    isError: false, 
    hasNextPage: true 
  });
  let currentPage = 1;

  effect(() => {
    currentPage = 1;
    state.value = { 
      pages: [], 
      isPending: true, 
      isFetchingNextPage: false, 
      isError: false, 
      hasNextPage: true 
    };
    executeFetch(true);
  });

  async function executeFetch (isReset) {
    try {
      let data      = await fetcher(currentPage);
      let hasNext   = data.length === limit; 
      
      // Nutze .peek(), um die aktuellen Pages zu holen, ohne das Signal zu abonnieren!
      let currentPages = state.peek().pages;
      let nextPages    = isReset ? [data] : [...currentPages, data]; 
      
      state.value = {
        pages: nextPages,
        isPending: false,
        isFetchingNextPage: false,
        isError: false,
        hasNextPage: hasNext
      };
      
      if (hasNext) currentPage++;
    } catch (e) {
      console.error(e);
      // Auch im Fehlerfall .peek() nutzen, um den restlichen State zu behalten
      let currentState = state.peek();
      state.value = { 
        ...currentState, 
        isPending: false, 
        isFetchingNextPage: false, 
        isError: true 
      };
    }
  }

  function fetchNextPage() {
    let currentState = state.peek();
    if (!currentState.hasNextPage || currentState.isFetchingNextPage) return;
    // Status auf "Lade nÃ¤chste Seite" setzen
    state.value = { ...currentState, isFetchingNextPage: true };
    executeFetch(false); 
  }

  return { state, fetchNextPage };
};
export let signalWithOptimisticInfiniteQuery = (fetcher, { limit = 60 }={}) => {
  let state = signal({ 
    pages: [], 
    isPending: true, 
    isFetchingNextPage: false, 
    isError: false, 
    hasNextPage: true 
  });
  
  let currentPage     = 1;
  let cachedNextPage  = null; // Holds the pre-fetched data
  let prefetchPromise = null; // Tracks ongoing background fetches
  let realHasNext     = true; // The actual truth from the API
  let runToken        = 0;    // Protects against race conditions (e.g., language change during fetch)

  // Hidden background worker
  async function prefetchNext(token) {
    if (prefetchPromise || !realHasNext) return;
    
    prefetchPromise = fetcher(currentPage + 1)
      .then(data => {
        if (token !== runToken) return; // Discard if search/language changed
        cachedNextPage = data;
        realHasNext = data.length === limit;
      })
      .catch(e => {
        if (token !== runToken) return;
        cachedNextPage = null; // Let the standard fetch retry later
      })
      .finally(() => {
        if (token === runToken) prefetchPromise = null;
      });
  }

  effect(() => {
    // Reset state when dependencies change
    runToken++;
    let token = runToken;
    
    currentPage     = 1;
    cachedNextPage  = null;
    prefetchPromise = null;
    realHasNext     = true;
    
    state.value = { 
      pages: [], 
      isPending: true, 
      isFetchingNextPage: false, 
      isError: false, 
      hasNextPage: true 
    };
    
    executeInitialFetch(token);
  });

  async function executeInitialFetch (token) {
    try {
      let data = await fetcher(1);
      if (token !== runToken) return;

      realHasNext = data.length === limit;
      
      state.value = {
        pages: [data],
        isPending: false,
        isFetchingNextPage: false,
        isError: false,
        hasNextPage: realHasNext
      };
      
      // Initial load complete. Silently start fetching page 2!
      if (realHasNext) prefetchNext(token);
      
    } catch (e) {
      if (token !== runToken) return;
      state.value = { ...state.peek(), isPending: false, isError: true };
    }
  }
  async function fetchNextPage() {
    let currentState = state.peek();
    if (!currentState.hasNextPage || currentState.isFetchingNextPage) return;
    
    let token = runToken;

    // SCENARIO 1: The user scrolled so fast, the background fetch is still running!
    if (prefetchPromise) {
      state.value = { ...currentState, isFetchingNextPage: true };
      await prefetchPromise; 
      if (token !== runToken) return;
    }

    // SCENARIO 2: CACHE HIT! The background fetch finished successfully.
    if (cachedNextPage !== null) {
      let data = cachedNextPage;
      cachedNextPage = null; // Consume the cache
      currentPage++;
      
      state.value = {
        ...state.peek(),
        pages: [...state.peek().pages, data],
        isFetchingNextPage: false,
        hasNextPage: realHasNext // Update UI based on what the prefetch discovered
      };
      
      // Kick off the NEXT prefetch in the background
      if (realHasNext) prefetchNext(token);
      return;
    }

    // SCENARIO 3: CACHE MISS (e.g. background fetch failed). Fallback to standard fetch.
    state.value = { ...state.peek(), isFetchingNextPage: true };
    try {
      let data = await fetcher(currentPage + 1);
      if (token !== runToken) return;
      
      currentPage++;
      realHasNext = data.length === limit;
      
      state.value = {
        ...state.peek(),
        pages: [...state.peek().pages, data],
        isFetchingNextPage: false,
        hasNextPage: realHasNext
      };
      
      if (realHasNext) prefetchNext(token);
    } catch (e) {
      if (token !== runToken) return;
      state.value = { ...state.peek(), isFetchingNextPage: false, isError: true };
    }
  }

  return { state, fetchNextPage };
};

// API: Map with Reactivity + Persistence
let createPersistentSignalMap = (storage, key, init) => {
  let saved = tryParse(storage.getItem(key), null);
  let sm    = signalMap(saved ?? init);
  effect(() => storage.setItem(key, JSON.stringify(sm.toObject())));
  return sm;
};
export let signalMap = (init = []) => {
  let entries = Array.isArray(init) ? init : Object.entries(init);
  let sig     = signal(new Map(entries));
  let mutate  = fn => { let m = new Map(sig.peek()); fn(m); sig.value = m; };

  return {
    get $signal () { return sig; },
    get size    () { return sig.value.size; },
    has      : k     => sig.value.has(k),
    get      : k     => sig.value.get(k),
    set      : (k,v) => mutate(m => m.set(k, v)),
    delete   : k     => mutate(m => m.delete(k)),
    clear    : ()    => sig.value = new Map(),
    forEach  : cb    => sig.value.forEach(cb),
    keys     : ()    => sig.value.keys(),
    values   : ()    => sig.value.values(),
    entries  : ()    => sig.value.entries(),
    toArray  : ()    => [...sig.value.entries()],
    toObject : ()    => Object.fromEntries(sig.value),
    [Symbol.iterator]() { return sig.value[Symbol.iterator](); },
  };
};
export let signalMapWithStorage = (key, init = []) => createPersistentSignalMap(  localStorage, key, init);
export let signalMapWithSession = (key, init = []) => createPersistentSignalMap(sessionStorage, key, init);

// API: Set with Reactivity + Persistence
let createPersistentSignalSet = (storage, key, init) => {
  let saved = tryParse(storage.getItem(key), null);
  let ss    = signalSet(Array.isArray(saved) ? saved : (init ?? []));
  effect(() => storage.setItem(key, JSON.stringify(ss.toArray())));
  return ss;
};
export let signalSet = (init = []) => {
  let sig    = signal(new Set(init));
  let mutate = fn => { let s = new Set(sig.peek()); fn(s); sig.value = s; };

  return {
    get $signal () { return sig; },
    get size    () { return sig.value.size; },
    has     : v  => sig.value.has(v),
    add     : v  => mutate(s => s.add(v)),
    delete  : v  => mutate(s => s.delete(v)),
    toggle  : v  => mutate(s => s.has(v) ? s.delete(v) : s.add(v)),
    clear   : () => sig.value = new Set(),
    forEach : cb => sig.value.forEach(cb),
    values  : () => sig.value.values(),
    toArray : () => [...sig.value],
    [Symbol.iterator]() { return sig.value[Symbol.iterator](); },
  };
};
export let signalSetWithStorage = (key, init = []) => createPersistentSignalSet(  localStorage, key, init);
export let signalSetWithSession = (key, init = []) => createPersistentSignalSet(sessionStorage, key, init);


/*
let createPersistentCollection = (storage, key, init, factory, serialize) => {
  let saved = tryParse(storage.getItem(key), null);
  let col   = factory(saved ?? init);
  effect(() => storage.setItem(key, JSON.stringify(serialize(col))));
  return col;
};

let createPersistentSignalMap = (storage, key, init) => createPersistentCollection(storage, key, init, signalMap, c => c.toObject());
let createPersistentSignalSet = (storage, key, init) => createPersistentCollection(storage, key, init, signalSet, c => c.toArray());
*/



// ====== useSignal =================================================

// API: Hooks with Persistence (component-scoped, auto-disposed)
let useCreatePersistentSignal = (storage, key, init, options = {}) => {
  let { syncTabs = true } = options;
  let saved = storage.getItem(key);
  if (saved !== null) init = deserialize(saved);

  let sig = useSignal(init);

  // Persist on every change
  useSignalEffect(() => storage.setItem(key, serialize(sig.value)));

  // Tab sync â€” only localStorage, cleans up on unmount
  if (syncTabs && storage === window.localStorage) {
    useEffect(() => {
      let handler = e => {
        if (e.key === key && e.newValue !== null) {
          let newVal = deserialize(e.newValue);
          if (serialize(sig.peek()) !== serialize(newVal)) sig.value = newVal;
        }
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    }, [key]);
  }

  return sig;
};
export let useSignalWithStorage = (init, key, options) => useCreatePersistentSignal( window.localStorage,   key, init, options );
export let useSignalWithSession = (init, key, options) => useCreatePersistentSignal( window.sessionStorage, key, init, options );
export let useSignalWithCookie  = (init, key, options = {}) => {
  let { expires = 365, path = '/' } = options;
  let saved = getCookie(key);
  let sig   = useSignal(saved !== null ? saved : init);

  useSignalEffect(() => setCookie(key, sig.value));
  return sig;
};



// Fine-grained deep reactive objects for @preact/signals.
// Each leaf property is an independent signal â€” mutations are perfectly scoped.

// Internal Registry
let _leaves = new WeakSet();
let _meta   = new WeakMap();

let isLeaf = v => _leaves.has(v);
let isNode = v => v !== null && typeof v === 'object' && _meta.has(v);

let _makeLeaf = val => {
  let s = signal(val);
  _leaves.add(s);
  return s;
};

let _spawn = val => isPlainObj(val) ? _makeNode(val) : _makeLeaf(val);
// Snapshot Helpers
// reactive=true  â†’ tracks every descendant signal (for effect/computed)
// reactive=false â†’ peek only, no subscriptions created
let _raw = ({ children, keysSignal }, reactive) => {
  if (reactive) void keysSignal.value;
  let out = {};
  for (let [k, child] of children)
    out[k] = isLeaf(child)
      ? (reactive ? child.value : child.peek())
      : _raw(_meta.get(child), reactive);
  return out;
};
// Node Factory
let _makeNode = obj => {
  let children   = new Map();
  let keysSignal = signal(Object.keys(obj));
  let meta       = { children, keysSignal, sig: null }; // closure ref â€” no WeakMap lookup in hot paths

  for (let key of keysSignal.peek())
    children.set(key, _spawn(obj[key]));

  let proxy = new Proxy({}, {
    get(_, key) {
      if (typeof key === 'symbol') return undefined;
      
      switch (key) {
        case '$raw'  : return _raw(meta, true);
        case '$peek' : return () => _raw(meta, false);
        case '$keys' : return keysSignal.value;
        case '$signal': {
          if (!meta.sig) meta.sig = computed(() => _raw(meta, true)); // lazy â€” only pay when needed
          return meta.sig;
        }
        case '$update': return patch => {
          for (let [k,v] of Object.entries(patch))
          isPlainObj(v) ? proxy[k].$update(v) : proxy[k] = v;
        };
        case '$toggle': return dotKey => {
          let parts  = dotKey.split('.');
          let last   = parts.pop(); // mutates parts â†’ prefix path, last â†’ leaf key
          let target = parts.reduce((p,k) => p[k], proxy);
          let v = target[last];
          target[last] = typeof v === 'boolean' ? !v
                       : v === 'on'             ? 'off'
                       : v === 'off'            ? 'on' : v;
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
        if (isLeaf(child) && !isPlainObj(value)) { child.value = value; return true; } // scalarâ†’scalar: minimal blast radius
        if (isNode(child) &&  isPlainObj(value)) { _merge(child, value); return true; } // objectâ†’object: deep merge, preserves signals
        // type changed (scalarâ†”object): replace â€” old consumers stop updating, correct by design
      }
      
      // new key or type change: spawn + conditionally announce structural change
      children.set(key, _spawn(value));
      if (child === undefined) keysSignal.value = [...keysSignal.peek(), key];
      return true;
    },
    
    deleteProperty(_, key) {
      if (children.has(key)) {
        children.delete(key);
        keysSignal.value = keysSignal.peek().filter(k => k !== key);
      }
      return true;
    },
    
    has (_, key) { return children.has(key); },
    ownKeys (_)  { void keysSignal.value; return [...children.keys()]; },
    getOwnPropertyDescriptor(_, key) {
      return children.has(key)
        ? { configurable: true, enumerable: true, writable: true }
        : undefined;
    },
  });

  _meta.set(proxy, meta);
  return proxy;
};
let _merge = (proxy, obj) => {
  let { children } = _meta.get(proxy);
  let keys = new Set(Object.keys(obj));
  for (let key of keys)            proxy[key] = obj[key];
  for (let key of children.keys()) if (!keys.has(key)) delete proxy[key];
};
// â”€â”€â”€ Public API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export let deepSignal = init => _makeNode(init);
let createPersistentDeepSignal = (key, init, storage) => {
  let saved = tryParse( storage.getItem(key), null );
  let sig   = deepSignal(saved ?? init);
  effect(() => storage.setItem(key, JSON.stringify(sig.$signal.value)));
  return sig;
};
export let deepSignalWithStorage = ({ key, value }) => createPersistentDeepSignal(key, value,   localStorage);
export let deepSignalWithSession = ({ key, value }) => createPersistentDeepSignal(key, value, sessionStorage);



//
let createUsePersistentDeepSignal = (storage, key, init) => {
  let ref = useRef(null);
  if (ref.current === null) {
    let saved = tryParse(storage.getItem(key), null);
    ref.current = deepSignal(saved ?? init);
  }
  useSignalEffect(() => storage.setItem(key, JSON.stringify(ref.current.$signal.value)));
  return ref.current;
};
export let useDeepSignal = init => {
  let ref = useRef(null);
  if (ref.current === null) ref.current = deepSignal(init);
  return ref.current;
};
export let useDeepSignalWithStorage = ({ key, value }) => createUsePersistentDeepSignal(  localStorage, key, value);
export let useDeepSignalWithSession = ({ key, value }) => createUsePersistentDeepSignal(sessionStorage, key, value);



// ============ WITH BUNKER ============ //

/*
let withBunker = async (db, table, key, init, factory, serialize) => {
  let saved = await db.get(table, key);
  let col   = factory(saved ?? init);
  effect(() => db.set(table, key, serialize(col)));
  return col;
};

export let signalMapWithBunker  = (db, table, key, init = []) => withBunker(db, table, key, init, signalMap, c => c.toObject());
export let signalSetWithBunker  = (db, table, key, init = []) => withBunker(db, table, key, init, signalSet, c => c.toArray());
export let deepSignalWithBunker = (db, table, key, init)      => withBunker(db, table, key, init, deepSignal, v => v);
// Note: `_persist` can stay or be folded into withBunker
*/

export let signalWithBunker  = async (database, table, key, init) => {
  let db    = new BunkerDB(database);
  let saved = await db.get(table, key);
  let sig   = signal( !isNullish(saved) ? saved : init );
  effect(() => db.set(table, key, sig.value));
  return sig;
};
export let signalMapWithBunker  = async (db, table, key, init = []) => {
  let saved = await db.get(table, key);
  let rm    = signalMap(saved ?? init);
  effect(() => db.set(table, key, rm.toObject()));
  return rm;
};
export let signalSetWithBunker  = async (db, table, key, init = []) => {
  let saved = await db.get(table, key);
  let rs    = signalSet(Array.isArray(saved) ? saved : init);
  effect(() => db.set(table, key, rs.toArray()));
  return rs;
};
export let useSignalWithBunker  = (database, table, key, init) => {
  let sig = useSignal(init);

  useEffect(() => {
    let db = new BunkerDB(database);
    db.get(table, key).then( saved => { if (!isNullish(saved)) sig.value = saved; });
  }, [database, table, key]);

  useSignalEffect(() => {
    let db = new BunkerDB(database);
    db.set(table, key, sig.value);
  });

  return sig;
};
export let deepSignalWithBunker = async (db, table, key, init) => {
  let saved = await db.get(table, key);
  let sig   = deepSignal(saved ?? init);
  effect(() => db.set(table, key, sig.$signal.value));
  return sig;
};
