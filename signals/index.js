// @aufbau/signals
// a customized/extended layer over @preact/signals. re-exports the preact primitives
// (raw signal/Signal renamed to preactSignal/PreactSignal) alongside this package's
// own carriers, the signalStore factory and the persistence stores.

// TODO: back persistence with @bunker/db — the store interface already allows an async
//       get(), so it can be added without touching the factory.
// TODO: betterSignal stays for now, but signalStore is where it is headed: a plain
//       object argument there is a leaf's declared shape, never guessed-at config.

// :::::: PREACT PRIMITIVES

export { batch, computed, effect, untracked } from './shared.js';
export { signal as preactSignal, Signal as PreactSignal } from './shared.js';

// :::::: SIGNAL TYPES
// each one stands alone: a class plus a lowercase factory, no config object.

export { BoolSignal,   boolSignal }   from './BoolSignal.js';
export { EnumSignal,   enumSignal }   from './EnumSignal.js';
export { MapSignal,    mapSignal }    from './MapSignal.js';
export { RecordSignal, recordSignal } from './RecordSignal.js';
export { ScalarSignal, scalarSignal } from './ScalarSignal.js';
export { SetSignal,    setSignal }    from './SetSignal.js';
export { StringSignal, stringSignal } from './StringSignal.js';

// deepSignal is the nested object carrier — one signal per leaf, where RecordSignal
// holds the whole object in one.
export { deepSignal, isDeep } from './DeepSignal.js';
export { querySignal }        from './QuerySignal.js';

// :::::: STORE

export { signalStore } from './SignalStore.js';

// :::::: FACTORY (legacy)
// the config-object factory. kept while call sites move to signalStore.

export { betterSignal, betterSignal as signal } from './BetterSignal.js';

// :::::: PERSISTENCE STORES

export { aufbauStore, cookie, local, none, session } from './persistence.js';

// :::::: FETCHERS + HOOKS

export { dummyFetcher, fakeFetcher }  from './fetchers.js';
export { useQuerySignal, useSignal }  from './hooks.js';
