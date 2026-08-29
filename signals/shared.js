// @aufbau/signals/shared.js 
// (internal helpers + vendors)

// :::::: HELPERS

export const
isAbort       = error => error?.name === 'AbortError',
isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value),
isPromise     = value => value !== null && typeof value?.then === 'function';
//isNode        = value => value !== null && typeof value === 'object' && _meta.has(value);

export function toEntries (sth) {
  return Array.isArray(sth) ? sth : Object.entries(sth);
}

// ::: by vendors 
// (will later be copied into this package directly)
export { isFn, isString } from '@pulgasari/is';
export { default as arr } from '@pulgasari/arr';
export { default as obj } from '@pulgasari/obj';

export * from '@preact/signals';

/*
let isObject      = value => value !== null && typeof value === 'object';
let isPlainObject = value => isObject(value) && (value.constructor === Object || !value.constructor);
let isPromise     = value => isObject(value) && typeof value.then === 'function';
let isNode        = value => isObject(value) && _meta.has(value);
*/





