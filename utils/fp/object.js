// @aufbau/utils/fp/object.js

// data-last wrappers around the existing implementations in ../object.js,
// flipped argument order only, no reimplementation.
import { getPath, mapValues as mapValuesOf, omit as omitFrom, pick as pickFrom } from '../object.js';

// ============================================================================
// 1. READ
// ============================================================================

export const entries = Object.entries;
export const keys    = Object.keys;
export const values  = Object.values;

export const path = (keys, fallback) => (source) => getPath(source, keys, fallback);
export const prop = (key) => (source) => source?.[key];

// ============================================================================
// 2. TRANSFORM
// ============================================================================

// every transform returns a new object, ../object.js deepMerge is deliberately not
// wrapped here because it mutates its target
export const assoc     = (key, value) => (source) => ({ ...source, [key]: value });
export const mapValues = (fn) => (source) => mapValuesOf(source, fn);
export const merge     = (...sources) => (target) => Object.assign({}, target, ...sources);
export const omit      = (list) => (source) => omitFrom(source, list);
export const pick      = (list) => (source) => pickFrom(source, list);

export const dissoc = (key) => (source) => {
  const { [key]: removed, ...rest } = source;
  return rest;
};
