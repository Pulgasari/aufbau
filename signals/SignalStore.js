// @aufbau/signals/SignalStore.js
// a store of named, typed leaves behind a `.value`-free facade.
//
//   const ui = signalStore({
//     view : { type: 'enum', values: ['grid', 'list'], value: 'grid' },
//     dark : { type: Boolean, value: false },
//     tags : { type: Set,     value: [] },
//     pan  : { type: 'record', value: { x: 0, y: 0 } },
//   }, { key: 'app:ui:', store: local });
//
//   ui.view              // 'grid'  — reactive in render, no .value
//   ui.view = 'list'     // validated against the enum, off-list writes are ignored
//   ui.$signals.view     // the EnumSignal itself, for cycle() / toggle() / add()
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

// :::::: LEAVES

const createLeaf = (key, spec) => {
  if (!isPlainObject(spec)) throw new TypeError(`[signalStore] "${key}": a leaf is declared as { type, value }`);

  const Type = resolveType(spec.type);
  if (!Type) throw new TypeError(
    `[signalStore] "${key}": unknown type ${String(spec.type)} — name one of [${NAMES}], a native (Boolean/String/Map/Set/Object) or a signal class`);

  return Type === EnumSignal ? new EnumSignal(spec.value, spec.values) : new Type(spec.value);
};

// hydration is authoritative, so it writes past a leaf's own validation where the
// leaf says so (see EnumSignal.$restore)
const restore = (leaf, value) => leaf.$restore ? leaf.$restore(value) : (leaf.value = value);

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
    for (const [key, value] of Object.entries(loaded)) restore(signals.get(key), value);

    for (const key of keys) {
      const leaf = signals.get(key);
      let first  = true;
      effect(() => {
        const value = leaf.value;
        if (first) { first = false; return; }   // the hydrated/declared value is already stored, or intentionally not
        store.set(prefix + key, snapshotOf(leaf, value));
      });
      store.subscribe?.(prefix + key, value => { if (value !== undefined) restore(leaf, value); });
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
  const instances = Object.fromEntries(signals);

  // a plain-object view of every leaf's value, and the same as one reactive signal
  const snapshot = () => Object.fromEntries(keys.map(key => [key, signals.get(key).value]));
  const snapSignal = computed(snapshot);

  const update = patch => {
    if (!isPlainObject(patch)) return;
    for (const [key, value] of Object.entries(patch)) {
      const leaf = signals.get(key);
      if (leaf) leaf.value = value;
    }
  };

  let ready = null;

  const store = new Proxy({}, {
    get (_, key) {
      if (typeof key === 'symbol') return undefined;
      switch (key) {
        case '$signals'  : return instances;     // the carriers, for cycle() / toggle() / add()
        case '$snapshot' : return snapshot();
        case '$signal'   : return snapSignal;    // the whole store as one reactive value
        case '$update'   : return update;
        case '$keys'     : return keys;
        case '$ready'    : return ready;
      }
      return signals.get(key)?.value;
    },
    set (_, key, value) {
      const leaf = signals.get(key);
      if (leaf) leaf.value = value;              // unknown keys are ignored: the schema is the shape
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
