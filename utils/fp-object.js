// @aufbau/utils/fp/object.js

// data-last wrappers around the existing implementations in ../object.js,
// flipped argument order only, no reimplementation.
import { 
  getPath,
  mapValues as mapValuesOf, 
  omit      as omitFrom, 
  pick      as pickFrom 
} from '../object.js';

// :::::: READ

export const 
entries = Object.entries,
keys    = Object.keys,
values  = Object.values,

path = (keys, fallback) => source => getPath(source, keys, fallback),
prop = key              => source => source?.[key];

// :::::: TRANSFORM
// every transform returns a new object, ../object.js deepMerge is deliberately not
// wrapped here because it mutates its target

export const 
assoc     = (key, value) => (source) => ({ ...source, [key]: value }),
mapValues = fn           => (source) => mapValuesOf(source, fn),
merge     = (...sources) => (target) => Object.assign({}, target, ...sources),
omit      = list         => (source) => omitFrom(source, list),
pick      = list         => (source) => pickFrom(source, list);

export const dissoc = (key) => (source) => {
  const { [key]: removed, ...rest } = source;
  return rest;
};
