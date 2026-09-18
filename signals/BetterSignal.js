// @aufbau/signals/BetterSignal.js
// the extended factory. a plain object argument is ALWAYS config — wrap a real object
// value in { value } to store it. picks a carrier from the config (scalar / Map / Set /
// deep) and, when a `key` is given, wires hydration + persistence onto it.
// note: the public name is still open — index re-exports this as `signal`.

import { BoolSignal }               from './BoolSignal.js';
import { ScalarSignal }             from './ScalarSignal.js';
import { deepSignal }               from './DeepSignal.js';
import { makeMap, makeSet }         from './make.js';
import { resolveStore }             from './persistence.js';
import { effect, isPlainObject, isPromise } from './shared.js';

// carrier = the live value plus a uniform read/write pair the persistence layer uses.
// read() must subscribe (it runs inside an effect), write() must not re-validate.
// `nested` implies a deep carrier (nested persistence is per-leaf, see betterSignal).
let createCarrier = ({ deep, nested, type, value, values }) => {
  if (type === Boolean) { let target = new BoolSignal(value); return { target, read: () => target.value,     write: saved => { target.value = saved; } }; }
  if (type === Map)     { let target = makeMap(value);        return { target, read: () => target.toObject(), write: saved => target.replace(saved) }; }
  if (type === Set)     { let target = makeSet(value);        return { target, read: () => target.toArray(),  write: saved => target.replace(saved) }; }

  let depth = deep ?? (nested ? true : false);
  if (depth) { let target = deepSignal(value ?? {}, depth); return { target, read: () => target.$signal.value, write: saved => target.$replace(saved) }; }

  let target = new ScalarSignal(value, values);
  return {
    target,
    read  : () => target.value,
    // bypass the allow-list while restoring: a stored value is authoritative
    write : saved => { target.$values = null; target.value = saved; target.$values = values ?? null; },
  };
};

// hydrate first, persist afterwards — never write the initial value back over stored data.
// returns the readiness promise, resolved once hydration (sync or async) has applied.
let attachPersistence = (carrier, store, key) => {
  let live  = false;
  let saved = store.get(key);
  let apply = loaded => { if (loaded !== undefined) carrier.write(loaded); };

  let ready = isPromise(saved)
    ? saved.then(loaded => { apply(loaded); live = true; })
    : (apply(saved), live = true, Promise.resolve());

  effect(() => { let snapshot = carrier.read(); if (live) store.set(key, snapshot); });
  store.subscribe?.(key, apply);

  return ready;
};

// nested persistence for a deep signal: every seeded leaf persists under its own
// `prefix + leafKey`, so a write touches only the changed leaf's key (not one blob) and
// other consumers can read a leaf without knowing the whole shape. two properties the
// whole-blob path can't give:
//   - hydration MERGES stored leaves ($update, never $replace), so a leaf absent from
//     storage keeps its seed — partial and first-run storage stay correct.
//   - write-back skips each leaf's initial (hydration) run, so an untouched seed is never
//     written and a later change to the code default still wins.
// `only` optionally allow-lists which leaves persist; omitted persists them all.
let attachNestedPersistence = (target, store, prefix, only) => {
  let keep = key => !only || only.includes(key);
  let keys = target.$keys.filter(keep);

  let patch   = {};
  let pending = [];
  for (let key of keys) {
    let saved = store.get(prefix + key);
    if (isPromise(saved)) pending.push(saved.then(value => { if (value !== undefined) patch[key] = value; }));
    else if (saved !== undefined) patch[key] = saved;
  }

  let wire = () => {
    target.$update(patch);
    for (let key of keys) {
      let first = true;
      effect(() => {
        let value = target[key];
        if (first) { first = false; return; }   // the hydration/seed value is already stored (or intentionally not)
        store.set(prefix + key, value);
      });
      store.subscribe?.(prefix + key, value => { if (value !== undefined) target[key] = value; });
    }
  };

  return pending.length ? Promise.all(pending).then(wire) : (wire(), Promise.resolve());
};

export let betterSignal = input => {
  let config  = isPlainObject(input) ? input : { value: input };
  let carrier = createCarrier(config);

  if (!config.key) return carrier.target;

  let store = resolveStore(config.store);

  // `nested` spreads persistence across the deep leaves (key is the shared prefix);
  // otherwise the value persists as one entry under `key`.
  carrier.target.$ready = config.nested
    ? attachNestedPersistence(carrier.target, store, config.key, config.persist)
    : attachPersistence(carrier, store, config.key);

  return carrier.target;
};

export default betterSignal;
