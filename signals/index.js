// @aufbau/signals
// an extended layer over @preact/signals. the preact primitives pass through as
// they are, signal and Signal included, next to this package's typed signals,
// typedSignal, signalStore and the persistence storages.

// TODO: back persistence with @bunker/db — the store interface already allows an async
//       get(), so it can be added without touching the factory.

// :::::: PREACT PRIMITIVES

export {
  Signal, batch, computed, effect, signal, untracked,
  useComputed, useSignal, useSignalEffect,
} from './shared.js';

// :::::: SIGNAL TYPES
// each one stands alone: a class plus a lowercase factory, no config object. they
// share BaseSignal, which carries $ready, $restore(), asNode() and asElement().

export { BaseSignal }                 from './BaseSignal.js';
export { BoolSignal,   boolSignal }   from './BoolSignal.js';
export { EnumSignal,   enumSignal }   from './EnumSignal.js';
export { MapSignal,    mapSignal }    from './MapSignal.js';
export { NumberSignal, numberSignal } from './NumberSignal.js';
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

// :::::: PERSISTENCE
// a storage is given by name ('local', 'session', 'cookie', 'aufbau', 'none'), as
// localStorage or sessionStorage themselves, or as a { get, set } store

export { STORAGE_NAMES, persistSignal } from './persistence.js';

// :::::: FETCHERS + HOOKS

export { dummyFetcher, fakeFetcher } from './fetchers.js';
export {
  useBoolSignal, useEnumSignal, useMapSignal, useNumberSignal, useQuerySignal,
  useSetSignal, useStringSignal, useTypedSignal,
} from './hooks.js';
