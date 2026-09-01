// @aufbau/signals
// a customized/extended layer over @preact/signals. re-exports the preact primitives
// (raw signal/Signal renamed to preactSignal/PreactSignal) alongside this package's
// carriers: the extended `signal` factory, ScalarSignal, deepSignal and querySignal.

// TODO: should `values` also apply to leaves inside a deep object?
//       e.g. deep: { size: ['s','m','l'] } — structure carrying both. undecided.
// TODO: back persistence with @bunker/db — the store interface already allows an async
//       get(), so it can be added without touching the factory.
// TODO: naming — the extended factory is exported as both `signal` and `betterSignal`
//       while the public name is still open.

// :::::: PREACT PRIMITIVES

export { batch, computed, effect, untracked } from './shared.js';
export { signal as preactSignal, Signal as PreactSignal } from './shared.js';

// :::::: CARRIERS

export { betterSignal, betterSignal as signal } from './BetterSignal.js';
export { ScalarSignal, scalarSignal }           from './ScalarSignal.js';
export { deepSignal, isDeep }                    from './DeepSignal.js';
export { querySignal }                           from './QuerySignal.js';
export { makeMap, makeSet }                      from './make.js';

// :::::: STORES

export { cookie, local, none, session, signalStore } from './persistence.js';

// :::::: FETCHERS + HOOKS

export { dummyFetcher, fakeFetcher }  from './fetchers.js';
export { useQuerySignal, useSignal }  from './hooks.js';
