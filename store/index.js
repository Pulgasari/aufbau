// @aufbau/store
// a reactive, typed, multi-key store. bare access reads the value (store.dark);
// assignment writes it (store.dark = true); everything else is a string-keyed
// verb on the store (store.toggle('dark'), store.toNode('title')). verb names are
// reserved and can't be used as keys — the store throws on collision.
//
//   const ui = store({
//     dark : false,                                    // inferred bool
//     view : { type: 'enum', values: ['grid','list'] },// enum, init = first
//     zoom : { value: 100, min: 50, max: 200 },        // number with bounds
//   }, { key: 'app:ui', persist: localStorage });      // per-key persistence
//
//   ui.dark               // read
//   ui.dark = true        // write
//   ui.toggle('dark')     // typed method
//   ui.reset('zoom')      // back to init
//   ui.onChange('dark', v => …)
//   ui.toNode('view')     // reactive text node
//   ui.define('route', '/home')

import { describe, METHOD_VERBS, READ_VERBS } from './types.js';
import { makeCarrier }                        from './carrier.js';
import { effect }                             from './reactive.js';
import { persistKey, resolvePersist }         from './persist.js';

const UNIVERSAL = ['define', 'delete', 'get', 'keys', 'leaf', 'onChange', 'ready', 'reset', 'set', 'snapshot', 'sync', 'toElement', 'toNode'];
const RESERVED  = new Set([...UNIVERSAL, ...METHOD_VERBS, ...READ_VERBS]);

// toElement lives in the optional gui subpath so the core stays dom/gui-free;
// importing '@aufbau/store/gui' registers the adapter here.
let elementAdapter = null;
export function useElementAdapter (fn) { elementAdapter = fn; }

const snapshot = leaves => Object.fromEntries(Object.entries(leaves).map(([key, carrier]) => [key, carrier.peek()]));

function textNode () {
  if (typeof document === 'undefined') throw new Error('[@aufbau/store] toNode needs a dom');
  return document.createTextNode('');
}

// provisional: a fuller sync design comes later. binding: '--custom-prop' |
// 'attr:name' | 'data:name' | 'class:name'. target defaults to the root element.
function syncKey (carrier, binding, target) {
  const el = target ?? document.documentElement;
  const apply =
    binding.startsWith('--')      ? value => el.style.setProperty(binding, String(value)) :
    binding.startsWith('attr:')   ? value => (value === false || value == null ? el.removeAttribute(binding.slice(5)) : el.setAttribute(binding.slice(5), String(value))) :
    binding.startsWith('data:')   ? value => { el.dataset[binding.slice(5)] = String(value); } :
    binding.startsWith('class:')  ? value => el.classList.toggle(binding.slice(6), Boolean(value)) :
    () => { throw new Error(`[@aufbau/store] unknown sync binding "${binding}"`); };
  return effect(() => apply(carrier.get()));
}

export function store (schema, options = {}) {
  const leaves    = {};   // key -> carrier
  const disposers = {};   // key -> persistence dispose
  const readies   = [];   // hydration promises
  const ctx       = { store: null };
  const adapter   = resolvePersist(options.persist);
  const prefix    = options.key;

  function mustGet (key) {
    const carrier = leaves[key];
    if (!carrier) throw new Error(`[@aufbau/store] no such key: "${key}"`);
    return carrier;
  }

  const add = (key, spec) => {
    if (RESERVED.has(key)) throw new Error(`[@aufbau/store] "${key}" is a reserved verb and can't be a key`);
    const carrier = makeCarrier(describe(spec), ctx);
    leaves[key] = carrier;
    if (prefix && !carrier.readonly) {
      const wired = persistKey(adapter, `${prefix}:${key}`, carrier);
      disposers[key] = wired.dispose;
      readies.push(wired.ready);
    }
    return carrier;
  };

  const remove = key => { disposers[key]?.(); delete disposers[key]; delete leaves[key]; };

  for (const [key, spec] of Object.entries(schema)) add(key, spec);

  // forwards store.<verb>(key, ...args) to the carrier's method/read of that name
  const dispatch = (verb, kind) => (key, ...args) => {
    const carrier = mustGet(key);
    const table   = kind === 'read' ? carrier.reads : carrier.methods;
    if (!table[verb]) throw new Error(`[@aufbau/store] .${verb}() not available on "${key}" (type ${carrier.type})`);
    return table[verb](...args);
  };

  const verbs = {
    define    : (key, spec) => { if (leaves[key]) throw new Error(`[@aufbau/store] "${key}" already defined`); add(key, spec); return proxy; },
    'delete'  : key => { remove(key); return proxy; },
    get       : key => mustGet(key).get(),
    leaf      : key => leaves[key],
    onChange  : (key, fn) => { const carrier = mustGet(key); let first = true; return effect(() => { const value = carrier.get(); if (first) { first = false; return; } fn(value); }); },
    reset     : key => { key === undefined ? Object.values(leaves).forEach(c => c.reset()) : mustGet(key).reset(); return proxy; },
    set       : (key, value) => { mustGet(key).set(value); return proxy; },
    sync      : (key, binding, target) => syncKey(mustGet(key), binding, target),
    toElement : (key, opts) => { if (!elementAdapter) throw new Error('[@aufbau/store] toElement needs the gui adapter — import "@aufbau/store/gui"'); return elementAdapter(proxy, key, opts); },
    toNode    : key => { const carrier = mustGet(key); const node = textNode(); effect(() => { node.data = String(carrier.get()); }); return node; },
  };

  const proxy = new Proxy(leaves, {
    get (target, prop) {
      if (typeof prop !== 'string')    return Reflect.get(target, prop);
      if (prop === 'keys')             return Object.keys(leaves);
      if (prop === 'snapshot')         return () => snapshot(leaves);
      if (prop === 'ready')            return Promise.all(readies).then(() => proxy);
      if (prop in verbs)               return verbs[prop];
      if (METHOD_VERBS.has(prop))      return dispatch(prop, 'method');
      if (READ_VERBS.has(prop))        return dispatch(prop, 'read');
      const carrier = leaves[prop];
      return carrier ? carrier.get() : undefined;
    },
    set (target, prop, value) {
      if (typeof prop === 'string' && leaves[prop]) leaves[prop].set(value);
      return true;   // writes to verbs / unknown keys are ignored
    },
    has (target, prop) { return typeof prop === 'string' && prop in leaves; },
    ownKeys () { return Object.keys(leaves); },
    getOwnPropertyDescriptor () { return { enumerable: true, configurable: true }; },
  });

  ctx.store = proxy;
  return proxy;
}

export { store as default };
