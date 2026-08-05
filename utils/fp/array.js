// @aufbau/utils/fp/array.js

// data-last array transformers, ready to drop into pipe().
// hand-written closures instead of curry(), one less rest-spread per call on a hot path.

// ============================================================================
// 1. TRANSFORM
// ============================================================================

export const filter  = (fn) => (list) => list.filter(fn);
export const flat    = (depth = 1) => (list) => list.flat(depth);
export const flatMap = (fn) => (list) => list.flatMap(fn);
export const map     = (fn) => (list) => list.map(fn);
export const reduce  = (fn, initial) => (list) => list.reduce(fn, initial);

// ============================================================================
// 2. QUERY
// ============================================================================

export const every = (fn) => (list) => list.every(fn);
export const find  = (fn) => (list) => list.find(fn);
export const some  = (fn) => (list) => list.some(fn);

// ============================================================================
// 3. ORDER & SHAPE
// ============================================================================

// sort and reverse copy first, the native methods mutate in place
export const drop    = (count) => (list) => list.slice(count);
export const join    = (separator = '') => (list) => list.join(separator);
export const reverse = (list) => [...list].reverse();
export const sort    = (compare) => (list) => [...list].sort(compare);
export const take    = (count) => (list) => list.slice(0, count);
export const uniq    = (list) => [...new Set(list)];

// ============================================================================
// 4. SEQUENCE OPS (arrays AND strings)
// ============================================================================

export const at       = (index) => (sequence) => sequence.at(index);
export const concat   = (...values) => (sequence) => sequence.concat(...values);
export const includes = (search) => (sequence) => sequence.includes(search);
export const indexOf  = (search) => (sequence) => sequence.indexOf(search);
export const slice    = (start, end) => (sequence) => sequence.slice(start, end);
