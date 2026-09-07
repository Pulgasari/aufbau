// @aufbau/signals/TypedSignal.js
// typedSignal — a store of TYPED leaves behind a `.value`-free facade. this is the join
// the deepSignal TODO left open ("should `values` also apply to leaves inside a deep
// object?"): a nested proxy that reads/writes without `.value` (like deepSignal) whose
// leaves are typed carriers — enum-validated, bool-coerced, opaque ref, derived — rather
// than plain signals. a spike / variant next to betterSignal; nothing here touches
// DeepSignal or BetterSignal.
//
//   const ui = typedSignal({
//     view  : oneOf(['grid','list'], 'grid'),      // enum — writes off the list are ignored
//     dark  : bool(false),                          // coerced to boolean
//     size  : number(12),
//     query : text(''),
//     open  : ref(null),                            // opaque object, held by identity
//     tags  : list([]),                             // array leaf, by value
//     label : derived(s => s.view.toUpperCase()),   // computed from other leaves (read-only)
//     panel : { collapsed: bool(false) },           // nested sub-store
//   }, { key: 'app:ui', store: local });            // optional persistence
//
//   ui.view          // 'grid'   — reactive in render, no `.value`
//   ui.view = 'list' // validated against the enum
//   ui.$snapshot     // plain-object view of the writable leaves

import { signal, computed, effect, isPlainObject, isPromise } from './shared.js';
import { ScalarSignal } from './ScalarSignal.js';
import { BoolSignal }   from './BoolSignal.js';
import { resolveStore } from './persistence.js';

// ── leaf descriptors (branded, so a schema tells a leaf from a nested store) ───

const LEAF   = Symbol('typed-leaf');
const leaf   = spec => ({ [LEAF]: true, ...spec });
const isLeaf = v => !!v && v[LEAF] === true;

export const text    = (value = '')    => leaf({ kind: 'text',    value });
export const number  = (value = 0)     => leaf({ kind: 'number',  value });
export const bool    = (value = false) => leaf({ kind: 'bool',    value });
export const oneOf   = (values, value) => leaf({ kind: 'enum',    values, value: value ?? values[0] });
export const ref     = (value = null)  => leaf({ kind: 'ref',     value });   // opaque, by identity
export const list    = (value = [])    => leaf({ kind: 'list',    value });   // array, by value
export const derived = (fn)            => leaf({ kind: 'derived', fn });

// ── cells: the reactive backing per leaf. read() subscribes; write() may validate ──

const makeCell = (spec, getStore) => {
  switch (spec.kind) {
    case 'bool': {
      const sig = new BoolSignal(spec.value);
      return { read: () => sig.value, write: v => { sig.value = v; } };
    }
    case 'enum': {
      const sig = new ScalarSignal(spec.value, spec.values);   // off-list writes are ignored (warns)
      return { read: () => sig.value, write: v => { sig.value = v; } };
    }
    case 'number': {
      const sig = signal(spec.value);
      return { read: () => sig.value, write: v => { sig.value = Number(v); } };
    }
    case 'text': {
      const sig = signal(spec.value);
      return { read: () => sig.value, write: v => { sig.value = v == null ? '' : String(v); } };
    }
    case 'ref':
    case 'list': {
      const sig = signal(spec.value);                          // opaque — held by identity, never wrapped
      return { read: () => sig.value, write: v => { sig.value = v; } };
    }
    case 'derived': {
      const c = computed(() => spec.fn(getStore()));
      return { read: () => c.value, readonly: true };
    }
    default:
      throw new Error(`[typedSignal] unknown leaf kind: ${spec.kind}`);
  }
};

// ── the store proxy ───────────────────────────────────────────────────────────

export function typedSignal (schema, options = {}) {
  const cells = new Map();   // key -> cell | { nested: store }
  let store;                 // assigned below; derived leaves read it lazily
  let ready = null;

  for (const [key, spec] of Object.entries(schema)) {
    if      (isLeaf(spec))        cells.set(key, makeCell(spec, () => store));
    else if (isPlainObject(spec)) cells.set(key, { nested: typedSignal(spec) });
    else                          cells.set(key, makeCell(text(spec), () => store)); // bare value -> text leaf
  }
  const keys = [...cells.keys()];

  // a reactive plain-object view of the writable leaves (nested recurse; derived excluded)
  const snapshot = () => {
    const out = {};
    for (const [key, cell] of cells) {
      if (cell.nested)        out[key] = cell.nested.$snapshot;
      else if (!cell.readonly) out[key] = cell.read();
    }
    return out;
  };
  const snapSignal = computed(snapshot);

  const apply = obj => {
    if (!isPlainObject(obj)) return;
    for (const [key, val] of Object.entries(obj)) {
      const cell = cells.get(key);
      if      (!cell || cell.readonly) continue;
      else if (cell.nested)            cell.nested.$apply(val);
      else                             cell.write(val);
    }
  };

  store = new Proxy({}, {
    get (_, key) {
      switch (key) {
        case '$snapshot': return snapshot();
        case '$signal'  : return snapSignal;   // reactive whole-store view (stable identity)
        case '$apply'   : return apply;
        case '$keys'    : return keys;
        case '$ready'   : return ready;
      }
      const cell = cells.get(key);
      if (!cell) return undefined;
      return cell.nested ? cell.nested : cell.read();
    },
    set (_, key, value) {
      const cell = cells.get(key);
      if (!cell || cell.nested || cell.readonly) return true;   // ignore writes to nested / derived / unknown
      cell.write(value);
      return true;
    },
    has (_, key)     { return cells.has(key); },
    ownKeys ()       { return keys; },
    getOwnPropertyDescriptor () { return { enumerable: true, configurable: true }; },
  });

  // ── persistence (one blob per store): hydrate first, then write back on change ──
  if (options.key) {
    const st    = resolveStore(options.store);
    const saved = st.get(options.key);
    let live = false;
    const hydrate = v => { if (v !== undefined) apply(v); live = true; };
    ready = isPromise(saved) ? saved.then(hydrate) : (hydrate(saved), Promise.resolve());

    let first = true;
    effect(() => {
      const snap = snapSignal.value;
      if (first) { first = false; return; }   // the hydrated/seed value is already stored
      if (live) st.set(options.key, snap);
    });
  }

  return store;
}

// :::::: EXPORT

export default typedSignal;
