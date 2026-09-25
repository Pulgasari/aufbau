// @aufbau/signals/shared.js

// :::::: LOCAL HELPERS

export const
isAbort       = error  => error?.name === 'AbortError',
isPlainObject = value  => value !== null && typeof value === 'object' && !Array.isArray(value),       
isPromise     = value  => value !== null && typeof value?.then === 'function',
toEntries     = source => Array.isArray(source) ? source : Object.entries(source);

// :::::: VENDORS

export { createStorage }  from '@bunker/storage';
export { isFn, isNumber } from '@pulgasari/is';
export { default as obj } from '@pulgasari/obj';
export { useRef }         from 'preact/hooks';

export {
  Signal,
  batch,
  computed,
  effect,
  signal,
  untracked,
  useComputed,
  useSignal,
  useSignalEffect,
} from '@preact/signals';
