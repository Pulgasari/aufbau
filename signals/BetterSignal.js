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
let createCarrier = ({ deep, type, value, values }) => {
  if (type === Boolean) { let target = new BoolSignal(value); return { target, read: () => target.value,     write: saved => { target.value = saved; } }; }
  if (type === Map)     { let target = makeMap(value);        return { target, read: () => target.toObject(), write: saved => target.replace(saved) }; }
  if (type === Set)     { let target = makeSet(value);        return { target, read: () => target.toArray(),  write: saved => target.replace(saved) }; }
  if (deep)             { let target = deepSignal(value ?? {}, deep); return { target, read: () => target.$signal.value, write: saved => target.$replace(saved) }; }

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

export let betterSignal = input => {
  let config  = isPlainObject(input) ? input : { value: input };
  let carrier = createCarrier(config);

  if (!config.key) return carrier.target;

  carrier.target.$ready = attachPersistence(carrier, resolveStore(config.store), config.key);
  return carrier.target;
};

export default betterSignal;
