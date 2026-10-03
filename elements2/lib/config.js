import { CanonicalMap }                  from '@pulgasari/canonicalmap';
import { isArray, isPlainObject, isString } from '@pulgasari/is';
import { str }                           from '@pulgasari/str';
import { emitEvent }                     from '@domina/methods/emitEvent.js';
import { onEvent }                       from '@domina/methods/onEvent.js';

const { toKebabCase } = str;

export const CONFIG_EVENT = 'aufbau-config-changed';

// two layers: the defaults of the elements, then what the page sets
const defaults = new CanonicalMap;
const settings = new CanonicalMap;
const merged   = new CanonicalMap;

const toValue = value => value == null ? null : String(value);

// { code: { theme: 'nord' } } -> code-theme: 'nord'
function flatten (input, prefix = '', out = new Map) {
  for (const [key, value] of Object.entries(input ?? {})) {
    const path = prefix ? `${prefix}-${key}` : key;
    if (isPlainObject(value)) flatten(value, path, out);
    else out.set(path, toValue(value));
  }
  return out;
}

// merges both layers and announces the keys that changed. null removes a key
function commit () {
  const next = new Map;
  for (const layer of [defaults, settings]) {
    for (const [key, value] of layer) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
  }

  const changed = [];
  for (const [key, value] of next) if (merged.get(key) !== value) changed.push(key);
  for (const key of merged.keys()) if (!next.has(key)) changed.push(key);
  if (!changed.length) return;

  merged.clear();
  merged.merge(next);
  if (typeof window !== 'undefined') emitEvent(window, CONFIG_EVENT, { changed, config: merged.toObject() });
}

// setConfig('code-theme', 'nord') or setConfig({ code: { theme: 'nord' } }).
// { layer: 'defaults' } is for the elements' own defaults
export function setConfig (keyOrEntries, value, options) {
  const single  = isString(keyOrEntries);
  const entries = single ? new Map([[keyOrEntries, toValue(value)]]) : flatten(keyOrEntries);
  const layer   = (single ? options : value)?.layer === 'defaults' ? defaults : settings;

  for (const [key, entry] of entries) layer.set(key, entry);
  commit();
}

export function getConfig (key, fallback) {
  const found = merged.get(key);
  return found === undefined ? fallback : found;
}

export const onConfigChange = listener => onEvent(window, CONFIG_EVENT, listener);
export const canonicalKey   = key => merged.key(key);

// the keys an element's setting is looked up under: picker-look, aufbau-picker-look
export function configKeys (tag, name) {
  const attr = toKebabCase(name);
  if (!tag) return [attr];

  const full  = toKebabCase(tag);
  const short = full.replace(/^aufbau-/, '');
  return [`${short}-${attr}`, `${full}-${attr}`];
}

export function resolveConfig (tag, name, keys = true) {
  let candidates = [keys];
  if (keys === true)  candidates = configKeys(tag, name);
  if (isArray(keys))  candidates = keys;

  for (const key of candidates) if (merged.has(key)) return merged.get(key);
  return undefined;
}
