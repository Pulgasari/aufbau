import { CanonicalMap }  from '@pulgasari/canonicalmap';
import { isPlainObject } from '@pulgasari/is';
import { emitEvent }     from '@domina/methods/emitEvent.js';
import { onEvent }       from '@domina/methods/onEvent.js';

// page wide defaults. an attribute falls back to the key tag-attribute:
// setConfig('app-panel-controls', 'close') is the default of <app-panel controls>

export const CONFIG_EVENT = 'aufbau-config-changed';

const config   = new CanonicalMap(null, ['kebab', 'camel', 'snake']);
const elements = new Map;   // tag -> the connected elements of it

// { aufbau: { code: { theme: 'nord' } } } -> aufbau-code-theme
function flatten (input, prefix = '', out = new Map) {
  for (const [key, value] of Object.entries(input)) {
    const path = prefix ? `${prefix}-${key}` : key;
    if (isPlainObject(value)) flatten(value, path, out);
    else out.set(path, value);
  }
  return out;
}

// the elements whose tag starts a changed key update.
// NOTE a key of data-tree-item starts with data-tree- too, so data-tree updates as well. harmless
function notify (changed) {
  for (const [tag, connected] of elements) {
    if (changed.some(key => key.startsWith(`${tag}-`))) connected.forEach(element => element.update());
  }
  if (typeof window !== 'undefined') emitEvent(window, CONFIG_EVENT, { changed });
}

// setConfig('aufbau-code-theme', 'nord') or setConfig({ 'aufbau-code': { theme: 'nord' } }). null removes
export function setConfig (keyOrEntries, value) {
  const entries = isPlainObject(keyOrEntries) ? flatten(keyOrEntries) : new Map([[keyOrEntries, value]]);
  const changed = [];

  for (const [key, next] of entries) {
    const text = next == null ? undefined : String(next);
    if (config.get(key) === text) continue;

    if (text === undefined) config.delete(key);
    else config.set(key, text);
    changed.push(config.key(key));
  }

  if (changed.length) notify(changed);
}

export const getConfig = (key, fallback) => config.get(key) ?? fallback;

export const onConfigChange = listener => onEvent(window, CONFIG_EVENT, listener);

// an element follows the config while it is connected. returns the stop
export function followConfig (element) {
  const tag = element.localName;
  if (!elements.has(tag)) elements.set(tag, new Set);
  elements.get(tag).add(element);
  return () => elements.get(tag)?.delete(element);
}
