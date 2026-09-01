// @aufbau/signals/shared.js
// (single internal hub — every vendor + util the package uses passes through here.
//  the used pieces will later be copied in directly so the package stands alone.)

// :::::: LOCAL HELPERS

export const
isAbort       = error => error?.name === 'AbortError',
isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value),
isPromise     = value => value !== null && typeof value?.then === 'function';

// arrays pass through, objects are read as their entries — the shape makeMap/makeSet want
export function toEntries (source) {
  return Array.isArray(source) ? source : Object.entries(source);
}

// :::::: VENDORS

export { createStorage }           from '@bunker/storage';
export { isFn, isNumber }          from '@pulgasari/is';
export { default as obj }          from '@pulgasari/obj';
export { useRef }                  from 'preact/hooks';

export {
  Signal,
  batch,
  computed,
  effect,
  signal,   // preact's plain leaf signal — the base our carriers build on
  untracked,
} from '@preact/signals';
