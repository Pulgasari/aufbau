// @aufbau/signals/make.js
// Map/Set carriers — a native collection behind a signal, mutated via copy-on-write
// so every change publishes a fresh reference. `$ready` is settable so the persistence
// layer can attach a hydration promise the same way it does on a ScalarSignal.

import { signal, toEntries } from './shared.js';

export let makeMap = (init = []) => {
  let entries = toEntries(init);
  let ready   = null;
  let sig     = signal(new Map(entries));
  let mutate  = fn => { let next = new Map(sig.peek()); fn(next); sig.value = next; };

  return {
    get $ready  ()      { return ready; },
    set $ready  (value) { ready = value; },
    get $signal ()      { return sig; },
    get size    ()      { return sig.value.size; },

    // core mutators
    set     : (key, val) => mutate(map => map.set(key, val)),
    delete  : key        => mutate(map => map.delete(key)),
    clear   : ()         => sig.value = new Map,
    replace : source     => sig.value = new Map(toEntries(source)),

    // delegation to underlying Map
    entries : ()  => sig.value.entries (),
    forEach : cb  => sig.value.forEach (cb),
    get     : key => sig.value.get     (key),
    has     : key => sig.value.has     (key),
    keys    : ()  => sig.value.keys    (),
    values  : ()  => sig.value.values  (),

    // helpers & serialization
    toArray  : () => [...sig.value.entries()],
    toObject : () => Object.fromEntries(sig.value),

    [Symbol.iterator]() { return sig.value[Symbol.iterator](); }
  };
};

export let makeSet = (init = []) => {
  let ready  = null;
  let sig    = signal(new Set(init));
  let mutate = fn => { let next = new Set(sig.peek()); fn(next); sig.value = next; };

  return {
    get $ready  ()      { return ready; },
    set $ready  (value) { ready = value; },
    get $signal ()      { return sig; },
    get size    ()      { return sig.value.size; },

    // core mutators
    add     : val => mutate(set => set.add    (val)),
    delete  : val => mutate(set => set.delete (val)),
    toggle  : val => mutate(set => set.has(val) ? set.delete(val) : set.add(val)),
    clear   : ()  => sig.value = new Set,
    replace : src => sig.value = new Set(src),

    // delegation to underlying Set
    forEach : cb  => sig.value.forEach (cb),
    has     : val => sig.value.has     (val),
    values  : ()  => sig.value.values  (),

    // helpers
    toArray : ()  => [...sig.value],

    [Symbol.iterator]() { return sig.value[Symbol.iterator](); }
  };
};
