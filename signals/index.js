// @aufbau/signals
// a customized/extended layer over @preact/signals. re-exports the preact primitives
// (raw signal/Signal renamed to preactSignal/PreactSignal) alongside this package's
// own carriers, the signalStore factory and the persistence stores.

// TODO: back persistence with @bunker/db — the store interface already allows an async
//       get(), so it can be added without touching the factory.
// TODO: betterSignal stays while call sites move to typedSignal and signalStore.

// :::::: PREACT PRIMITIVES

export { batch, computed, effect, untracked } from './shared.js';
export { signal as preactSignal, Signal as PreactSignal } from './shared.js';

// :::::: SIGNAL TYPES
// each one stands alone: a class plus a lowercase factory, no config object. they
// share BaseSignal, which carries $ready, $restore() and toNode().

export { BaseSignal }                 from './BaseSignal.js';
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

// :::::: ALLROUNDER + STORE
// typedSignal builds any of the types above from a { type, value } spec, signalStore
// holds several of them by name. both persist through the same storages.

export { typedSignal } from './TypedSignal.js';
export { signalStore } from './SignalStore.js';

// :::::: FACTORY (legacy)
// the config-object factory. kept while call sites move to signalStore.

export { betterSignal, betterSignal as signal } from './BetterSignal.js';

// :::::: PERSISTENCE
// a storage is given by name ('local', 'session', 'cookie', 'aufbau', 'none'), as
// localStorage or sessionStorage, or as a { get, set } store. the factories stay
// exported for the older form (store: local, store: cookie({ days: 7 }))

export { aufbauStore, cookie, local, none, persistSignal, resolveStorage, session } from './persistence.js';

// :::::: FETCHERS + HOOKS

export { dummyFetcher, fakeFetcher } from './fetchers.js';
export {
  useBoolSignal, useEnumSignal, useMapSignal, useQuerySignal, useSetSignal,
  useSignal, useStringSignal, useTypedSignal,
} from './hooks.js';
