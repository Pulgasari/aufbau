// @aufbau/elements/core/AufbauConfig.js
// <aufbau-config>
// central store for global configuration values, read via AufbauCore#getConfig()

import { CanonicalMap, createLogger, dom, isArray, isPlainObject, isString, toJson, toKebabCase } from '@aufbau/js';

const log = createLogger('aufbau-config');

//const KEY_FORMS = ['kebab', 'camel']; // stored kebab, readable in both forms
//const AufbauConfigStore = new CanonicalMap(null, KEY_FORMS);

const AufbauConfigStore = new CanonicalMap; // merged, read-only view of all sources. never write directly, use setConfig()
const CONFIG_EVENT = 'aufbau-config-changed';
const DEFAULTS = Symbol('defaults');
const RESERVED = new Set(['id', 'class', 'style', 'hidden', 'is', 'src']); // attributes that configure the element itself, not the store
const RUNTIME  = Symbol('runtime'); // programmatic source, always merged last so setConfig() beats markup
const sources  = new Map; // one source map per <aufbau-config> element, merged in connect order

//const newSource = () => new CanonicalMap(null, KEY_FORMS);
const newSource = () => new CanonicalMap;
const toValue = (value) => value == null ? null : String(value);

// { code: { theme: 'nord' } } -> 'code-theme'. the store normalizes each path itself
function flatten (input, prefix = '', out = newSource()) {
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

/** recomputes the merged store, emits only on real changes */
export function commitConfig () {
  const next    = mergeSources();
  const changed = diff(next);
  if (!changed.length) return changed;

  AufbauConfigStore.clear();
  AufbauConfigStore.merge(next);

  if (typeof window !== 'undefined') {
    dom.emitEvent (window, CONFIG_EVENT, { changed, config: AufbauConfigStore.toObject() });
  }

  return changed;
}

// :::::: PUBLIC API :::::::::::::::::::::::::::::::::::::::::::

/**
 * the store's canonical key form. the change list emitted with CONFIG_EVENT is
 * canonical, so anything comparing against it has to normalize the same way.
 */
export const canonicalKey = (key) => AufbauConfigStore.key(key);

/** key accepts any case form, 'codeTheme' and 'code-theme' resolve alike */
export function getConfig (key, fallback) {
  const found = AufbauConfigStore.get(key);
  return found === undefined ? fallback : found;
}

export function setConfig (keyOrMap, valueOrOptions, maybeOptions) {
  const isKey   = isString(keyOrMap);
  const options = (isKey ? maybeOptions : valueOrOptions) ?? {};
  const owner   = options.layer === 'defaults' ? DEFAULTS : RUNTIME;
  const entries = sources.get(owner) ?? newSource();
  sources.set(owner, entries);

  if (isKey) entries.set(keyOrMap, toValue(valueOrOptions));
  else entries.merge(flatten(keyOrMap));

  commitConfig();
  return AufbauConfigStore;
}

/**
 * candidate config keys for an element attribute.
 * <aufbau-code theme> -> ['code-theme', 'aufbau-code-theme']
 */
export function configKeys (tag, name) {
  const attr = toKebabCase(name);
  if (!tag) return [attr];

  const full  = toKebabCase(tag);
  const short = full.replace(/^aufbau-/, '');
  return [`${short}-${attr}`, `${full}-${attr}`];
}

/** first hit wins. keys: true (auto namespace) | string | string[] */
export function resolveConfig (tag, name, keys = true) {
  const candidates =
      keys === true ? configKeys(tag, name)
    : isArray(keys) ? keys
    : [keys];

  for (const key of candidates) if (AufbauConfigStore.has(key)) return AufbauConfigStore.get(key);
  return undefined;
}

export function onConfigChange (listener) {
  return dom.onEvent (window, CONFIG_EVENT, listener);
}

// :::::: ELEMENT ::::::::::::::::::::::::::::::::::::::::::::::

export class AufbauConfig extends HTMLElement {
  connectedCallback () {
    this.hidden = true; // never rendered
    this._observer = new MutationObserver(() => this.sync());
    this._observer.observe(this, { attributes: true, characterData: true, childList: true, subtree: true });
    this.sync();
  }

  disconnectedCallback () {
    this._observer?.disconnect();
    sources.delete(this);
    commitConfig(); // a removed config element must revoke its values
  }

  sync () {
    const entries = newSource();

    // 1. remote defaults, lowest precedence
    if (this._remote) entries.merge(this._remote);

    // 2. inline json body: <aufbau-config>{"code":{"theme":"nord"}}</aufbau-config>
    const body   = this.textContent.trim();
    const parsed = body ? toJson(body, null) : null;

    if (body && !isPlainObject(parsed)) log.warn('inline body is not a valid json object, ignored.');
    else if (parsed) entries.merge(flatten(parsed));

    // 3. attributes win, most explicit form
    for (const { name, value } of this.attributes) {
      if (RESERVED.has(entries.key(name))) continue;
      entries.set(name, value);
    }

    sources.set(this, entries);
    commitConfig();

    const src = this.getAttribute('src');
    if (src && src !== this._src) this.loadSrc(src);
  }

  async loadSrc (src) {
    this._src = src;
    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      this._remote = flatten(await response.json());
      this.sync();
    } catch (error) {
      log.warn(`could not load "${src}":`, error);
    }
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-config')) {
  customElements.define('aufbau-config', AufbauConfig);
}

export {
  AufbauConfigStore,
  CONFIG_EVENT,
}

export default AufbauConfig;
