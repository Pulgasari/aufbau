// :::::: IMPORTS

import { CanonicalMap } from '@pulgasari/canonicalmap';
import { isArray, isPlainObject, isString } from '@pulgasari/is';
import { str }          from '@pulgasari/str';
import { emitEvent } from '@domina/methods/emitEvent.js';
import { onEvent } from '@domina/methods/onEvent.js';
const { toKebabCase } = str;

// ::::::

const AufbauConfigStore = new CanonicalMap; // merged, read-only view of all sources. never write directly, use setConfig()
const CONFIG_EVENT = 'aufbau-config-changed';
const DEFAULTS     = Symbol('defaults');
const RUNTIME      = Symbol('runtime'); // programmatic source, always merged last so setConfig() beats markup
const sources      = new Map;
export const createSource = () => new CanonicalMap;
const toValue      = (value) => value == null ? null : String(value);

export function flatten (input, prefix = '', out = createSource()) {
  for (const [key, value] of Object.entries(input ?? {})) {
    const path = prefix ? `${prefix}-${key}` : key;
    if (isPlainObject(value)) flatten(value, path, out);
    else out.set(path, toValue(value));
  }
  return out;
}

function mergeSources () {
  const next  = new Map;
  const apply = (entries) => {
    for (const [key, value] of entries) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
  };

  if (sources.has(DEFAULTS)) apply(sources.get(DEFAULTS));
  for (const [owner, entries] of sources) {
    if (owner !== DEFAULTS && owner !== RUNTIME) apply(entries); // markup, in connect order
  }
  if (sources.has(RUNTIME)) apply(sources.get(RUNTIME));

  return next;
}

function diff (next) {
  const changed = [];
  for (const [key, value] of next) if (AufbauConfigStore.get(key) !== value) changed.push(key);
  for (const key of AufbauConfigStore.keys()) if (!next.has(key)) changed.push(key);
  return changed;
}

// recomputes the merged store, emits only on real changes
export function commitConfig () {
  const next    = mergeSources();
  const changed = diff(next);
  if (!changed.length) return changed;

  AufbauConfigStore.clear();
  AufbauConfigStore.merge(next);

  if (typeof window !== 'undefined') {
    emitEvent (window, CONFIG_EVENT, { changed, config: AufbauConfigStore.toObject() });
  }

  return changed;
}

// :::::: PUBLIC API :::::::::::::::::::::::::::::::::::::::::::

const canonicalKey   = (key)      => AufbauConfigStore.key(key);
const onConfigChange = (listener) => onEvent (window, CONFIG_EVENT, listener);
const setConfig      = (a,b,c)    => isString(a) ? setConfigValue(a,b,c) : setConfigObject(a,b);

export function getConfig (key, fallback) {
  const found = AufbauConfigStore.get(key);
  return found === undefined ? fallback : found;
}

// Internal helper to resolve target source storage
function getSource (options = {}) {
  const owner   = options.layer === 'defaults' ? DEFAULTS : RUNTIME;
  const entries = sources.get(owner) ?? createSource();
  sources.set(owner, entries);
  return entries;
}

// Set a single configuration entry
function setConfigValue (key, value, options) {
  getSource(options).set(key, toValue(value));
  commitConfig();
  return AufbauConfigStore;
}

// Merge an object of configuration entries
function setConfigObject (map, options) {
  getSource(options).merge(flatten(map));
  commitConfig();
  return AufbauConfigStore;
}

export function configKeys (tag, name) {
  const attr = toKebabCase(name);
  if (!tag) return [attr];

  const full  = toKebabCase(tag);
  const short = full.replace(/^aufbau-/, '');
  return [`${short}-${attr}`, `${full}-${attr}`];
}

export function resolveConfig (tag, name, keys = true) {
  const candidates =
      keys === true ? configKeys(tag, name)
    : isArray(keys) ? keys
    : [keys];

  for (const key of candidates) if (AufbauConfigStore.has(key)) return AufbauConfigStore.get(key);
  return undefined;
}

// the values of one <aufbau-config> element, merged in connect order
export function setConfigSource (owner, entries) {
  sources.set(owner, entries);
  commitConfig();
}

export function removeConfigSource (owner) {
  sources.delete(owner);
  commitConfig();
}

export {
  AufbauConfigStore,
  CONFIG_EVENT,
  canonicalKey,
  onConfigChange,
  setConfig,
  setConfigObject,
  setConfigValue,
};
