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
// a store grows after the fact, either by schema or by handing it a signal:
//
//   ui.$extend({ busy: { type: String, value: '' } });
//   ui.busy = StringSignal('');            // same thing, one leaf
//
// every leaf declares its type. that is the whole point of the mandatory `type`:
// the old factory read a plain object as config, so `signal({ x: 0, y: 0 })` quietly
// produced an empty scalar instead of the record it looks like. here the shape of a
// leaf is stated, not guessed.

// :::::: IMPORTS

import { BaseSignal }   from './BaseSignal.js';
import { BoolSignal }   from './BoolSignal.js';
import { EnumSignal }   from './EnumSignal.js';
import { MapSignal }    from './MapSignal.js';
import { RecordSignal } from './RecordSignal.js';
import { ScalarSignal } from './ScalarSignal.js';
import { SetSignal }    from './SetSignal.js';
import { StringSignal } from './StringSignal.js';

import { resolveStore } from './persistence.js';
import { computed, effect, isPlainObject, isPromise, signal, untracked } from './shared.js';

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

// any constructor standing on BaseSignal counts, so the exported (callable) types and
// anything subclassed from them resolve the same way the built-in names do.
const isType = type => typeof type === 'function' && (type === BaseSignal || type.prototype instanceof BaseSignal);

const resolveType = type =>
    typeof type === 'string' ? BY_NAME[type.toLowerCase()]
  : BY_NATIVE.get(type) ?? (isType(type) ? type : undefined);

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
//
// the schema a store is built with persists as a whole (`persist` optionally
// allow-lists it). a leaf added later does NOT, unless it says `persist: true` —
// most of what an app hangs on a store afterwards is working state that has no
// business in storage.

// a Map or Set does not survive JSON, so it is stored as the shape it reads back from
const snapshotOf = (leaf, value) =>
    leaf instanceof MapSignal ? Object.fromEntries(value)
  : leaf instanceof SetSignal ? [...value]
  : value;

const wireLeaf = (key, leaf, store, prefix) => {
  // $restore, not .value: hydration is authoritative and writes past a leaf's own
  // validation where the type says so (see EnumSignal)
  const apply = value => { if (value !== undefined) leaf.$restore(value); };

  const arm = () => {
    let first = true;
    effect(() => {
      const value = leaf.value;
      if (first) { first = false; return; }   // the hydrated/declared value is already stored, or intentionally not
      store.set(prefix + key, snapshotOf(leaf, value));
    });
    store.subscribe?.(prefix + key, apply);
  };

  const saved = store.get(prefix + key);
  if (isPromise(saved)) return saved.then(value => { apply(value); arm(); });

  apply(saved);
  arm();
  return Promise.resolve();
};

// :::::: MAIN

export function signalStore (schema, options = {}) {
  const signals    = new Map();
  const keysSignal = signal([]);   // bumped when a leaf is added, so $keys and $onEffect track

  const store  = options.key ? resolveStore(options.store) : null;
  const prefix = options.key ?? '';

  const syncKeys = () => keysSignal.value = [...signals.keys()];

  // add or replace a leaf. a signal instance goes in as it is, a spec is built first.
  const install = (key, leafOrSpec, persist) => {
    const existed = signals.get(key);
    if (existed) console.warn(`[signalStore] leaf "${key}" replaced — anything already reading the old carrier stays on it`);

    const leaf = leafOrSpec instanceof BaseSignal ? leafOrSpec : createLeaf(key, leafOrSpec);
    signals.set(key, leaf);
    warnReserved([key]);
    syncKeys();

    if (store && persist) leaf.$ready = wireLeaf(key, leaf, store, prefix);
    return leaf;
  };

  // the declared schema persists as a whole; `persist` narrows it
  const declared = Object.keys(schema);
  const keep     = key => !options.persist || options.persist.includes(key);
  for (const [key, spec] of Object.entries(schema)) install(key, spec, keep(key));

  const ready = store
    ? Promise.all(declared.filter(keep).map(key => signals.get(key).$ready))
    : Promise.resolve();

  // a plain-object view of every leaf's value, and the same as one reactive signal
  const snapshot   = () => Object.fromEntries([...signals].map(([key, leaf]) => [key, leaf.value]));
  const snapSignal = computed(snapshot);

  // one leaf by name, or several at once
  const read  = key => signals.get(key)?.value;
  const write = (key, value) => {
    if (isPlainObject(key)) { for (const [k, v] of Object.entries(key)) write(k, v); return; }
    const leaf = signals.get(key);
    if (leaf) leaf.value = value;           // unknown keys are ignored: the schema is the shape
  };

  // grow the store from a schema, the same shape it was built with
  const extend = (added = {}) => {
    for (const [key, spec] of Object.entries(added)) install(key, spec, spec?.persist === true);
    return proxy;
  };

  // an effect per leaf, keyed by name. it touches the key list too, so an effect
  // declared before its leaf exists starts running once the leaf arrives.
  const onEffect = (key, callback) => effect(() => {
    void keysSignal.value;
    const leaf = signals.get(key);
    if (!leaf) return;
    const value = leaf.value;
    untracked(() => callback(value));       // the callback's own reads are not this effect's business
  });

  const onEffects = (listeners) => {
    const disposers = Object.entries(listeners).map(([key, callback]) => onEffect(key, callback));
    return () => disposers.forEach(dispose => dispose?.());
  };

  const proxy = new Proxy({}, {
    get (_, key) {
      if (typeof key === 'symbol') return undefined;

      // the store's own surface wins over a leaf of the same name
      switch (key) {
        case 'get'        : return read;
        case 'set'        : return write;
        case '$extend'    : return extend;
        case '$onEffect'  : return onEffect;
        case '$onEffects' : return onEffects;
        case '$signals'   : return Object.fromEntries(signals);
        case '$snapshot'  : return snapshot();
        case '$signal'    : return snapSignal;   // the whole store as one reactive value
        case '$keys'      : return keysSignal.value;
        case '$ready'     : return ready;
      }

      // $name is the leaf's value, name is the leaf itself
      return key[0] === '$' ? read(key.slice(1)) : signals.get(key);
    },

    // a signal declares the leaf; anything else writes the value of an existing one
    set (_, key, value) {
      const name = key[0] === '$' ? key.slice(1) : key;
      if (value instanceof BaseSignal) install(name, value, false);
      else write(name, value);
      return true;
    },

    deleteProperty (_, key) { signals.delete(key) && syncKeys(); return true; },

    has     (_, key) { return signals.has(key); },
    ownKeys ()       { return keysSignal.peek(); },
    getOwnPropertyDescriptor () { return { configurable: true, enumerable: true, writable: true }; },
  });

  return proxy;
}

// :::::: EXPORT

export default signalStore;
