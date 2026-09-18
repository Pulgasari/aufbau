// @aufbau/signals/SignalStore.js
// a store of named, typed leaves.
//
//   const ui = signalStore({
//     view : { type: 'enum', values: ['grid', 'list'], value: 'grid' },
//     dark : { type: Boolean, value: false },
//   }, { key: 'app:ui:', store: local });
//
//   ui.view              // the EnumSignal itself
//   ui.view.value        // 'grid'
//   ui.view.cycle()      // its own methods, where the type has them
//   ui.$view             // 'grid'   — the value, no .value
//   ui.$view = 'list'    // and writes it
//
//   ui.get('view')                        // 'grid'
//   ui.set('view', 'list')                // one leaf
//   ui.set({ view: 'list', dark: true })  // several
//
// every leaf declares its type. that is the whole point of the mandatory `type`:
// the old factory read a plain object as config, so `signal({ x: 0, y: 0 })` quietly
// produced an empty scalar instead of the record it looks like. here the shape of a
// leaf is stated, not guessed.

// :::::: IMPORTS

import { BoolSignal }   from './BoolSignal.js';
import { EnumSignal }   from './EnumSignal.js';
import { MapSignal }    from './MapSignal.js';
import { RecordSignal } from './RecordSignal.js';
import { ScalarSignal } from './ScalarSignal.js';
import { SetSignal }    from './SetSignal.js';
import { StringSignal } from './StringSignal.js';

import { resolveStore } from './persistence.js';
import { computed, effect, isPlainObject, isPromise } from './shared.js';

// :::::: TYPES
// a leaf names its type as a string, as the native constructor where one fits, or
// as the signal class itself. all three land on the same class.

const BY_NAME = {
  bool   : BoolSignal,
  enum   : EnumSignal,
  map    : MapSignal,
  record : RecordSignal,
  scalar : ScalarSignal,
  set    : SetSignal,
  string : StringSignal,
};

const BY_NATIVE = new Map([
  [Boolean, BoolSignal],
  [String,  StringSignal],
  [Map,     MapSignal],
  [Set,     SetSignal],
  [Object,  RecordSignal],
]);

const CLASSES = new Set(Object.values(BY_NAME));

const resolveType = type =>
    typeof type === 'string' ? BY_NAME[type.toLowerCase()]
  : BY_NATIVE.get(type) ?? (CLASSES.has(type) ? type : undefined);

const NAMES = Object.keys(BY_NAME).join(', ');

// :::::: RESERVED
// the store answers to these itself, so a leaf of the same name is reachable only
// through get()/set(). warned about at construction rather than shadowed in silence.

const METHODS   = ['get', 'set'];                                       // ui.get  — shadows a leaf outright
const SHORTHAND = ['signals', 'snapshot', 'signal', 'keys', 'ready'];   // ui.$keys — shadows the $ form only

const warnReserved = (keys) => {
  for (const key of keys) {
    if (METHODS.includes(key))   console.warn(`[signalStore] leaf "${key}" is shadowed by the store's own ${key}() — reach it with get('${key}')`);
    if (SHORTHAND.includes(key)) console.warn(`[signalStore] leaf "${key}" has no $${key} shorthand ($${key} is the store's own) — read it as .${key}.value`);
  }
};

// :::::: LEAVES

const createLeaf = (key, spec) => {
  if (!isPlainObject(spec)) throw new TypeError(`[signalStore] "${key}": a leaf is declared as { type, value }`);

  const Type = resolveType(spec.type);
  if (!Type) throw new TypeError(
    `[signalStore] "${key}": unknown type ${String(spec.type)} — name one of [${NAMES}], a native (Boolean/String/Map/Set/Object) or a signal class`);

  return Type === EnumSignal ? new EnumSignal(spec.value, spec.values) : new Type(spec.value);
};

// :::::: PERSISTENCE
// one entry per leaf under `key + leafName`, never one blob: a write rewrites only
// the leaf that moved, and a leaf missing from storage keeps its declared default,
// so a later change to that default still wins.
// `persist` optionally allow-lists the leaves that are stored.

const attachPersistence = (signals, store, prefix, only) => {
  const keys = [...signals.keys()].filter(key => !only || only.includes(key));

  const loaded  = {};
  const pending = [];

  for (const key of keys) {
    const saved = store.get(prefix + key);
    if (isPromise(saved)) pending.push(saved.then(value => { if (value !== undefined) loaded[key] = value; }));
    else if (saved !== undefined) loaded[key] = saved;
  }

  const wire = () => {
    // $restore, not .value: hydration is authoritative and writes past a leaf's
    // own validation where the type says so (see EnumSignal)
    for (const [key, value] of Object.entries(loaded)) signals.get(key).$restore(value);

    for (const key of keys) {
      const leaf = signals.get(key);
      let first  = true;
      effect(() => {
        const value = leaf.value;
        if (first) { first = false; return; }   // the hydrated/declared value is already stored, or intentionally not
        store.set(prefix + key, snapshotOf(leaf, value));
      });
      store.subscribe?.(prefix + key, value => { if (value !== undefined) leaf.$restore(value); });
    }
  };

  return pending.length ? Promise.all(pending).then(wire) : (wire(), Promise.resolve());
};

// a Map or Set does not survive JSON, so it is stored as the shape it reads back from
const snapshotOf = (leaf, value) =>
    leaf instanceof MapSignal ? Object.fromEntries(value)
  : leaf instanceof SetSignal ? [...value]
  : value;

// :::::: MAIN

export function signalStore (schema, options = {}) {
  const signals = new Map();
  for (const [key, spec] of Object.entries(schema)) signals.set(key, createLeaf(key, spec));

  const keys      = [...signals.keys()];
  warnReserved(keys);
  const instances = Object.fromEntries(signals);

  // a plain-object view of every leaf's value, and the same as one reactive signal
  const snapshot = () => Object.fromEntries(keys.map(key => [key, signals.get(key).value]));
  const snapSignal = computed(snapshot);

  // one leaf by name, or several at once
  const read  = key => signals.get(key)?.value;
  const write = (key, value) => {
    if (isPlainObject(key)) { for (const [k, v] of Object.entries(key)) write(k, v); return; }
    const leaf = signals.get(key);
    if (leaf) leaf.value = value;           // unknown keys are ignored: the schema is the shape
  };

  let ready = null;

  const store = new Proxy({}, {
    get (_, key) {
      if (typeof key === 'symbol') return undefined;

      // the store's own surface wins over a leaf of the same name
      switch (key) {
        case 'get'       : return read;
        case 'set'       : return write;
        case '$signals'  : return instances;
        case '$snapshot' : return snapshot();
        case '$signal'   : return snapSignal;   // the whole store as one reactive value
        case '$keys'     : return keys;
        case '$ready'    : return ready;
      }

      // $name is the leaf's value, name is the leaf itself
      return key[0] === '$' ? read(key.slice(1)) : signals.get(key);
    },

    // assigning either form writes the value — a leaf is never replaced wholesale
    set (_, key, value) {
      write(key[0] === '$' ? key.slice(1) : key, value);
      return true;
    },

    has     (_, key) { return signals.has(key); },
    ownKeys ()       { return keys; },
    getOwnPropertyDescriptor () { return { configurable: true, enumerable: true, writable: true }; },
  });

  if (options.key) ready = attachPersistence(signals, resolveStore(options.store), options.key, options.persist);

  return store;
}

// :::::: EXPORT

export default signalStore;
