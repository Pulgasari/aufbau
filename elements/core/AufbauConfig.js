// @aufbau/elements/core/AufbauConfig.js
// <aufbau-config>
// central store for global configuration values, read via AufbauCore#getConfig()

import { toKebabCase } from './utils.js';

export const CONFIG_EVENT = 'aufbau-config-changed';

// merged, read-only view of all sources. never write directly, use setConfig()
export const AufbauConfigStore = new Map();

// one source map per <aufbau-config> element, merged in connect order
const sources = new Map();

// programmatic source, always merged last so setConfig() beats markup
const RUNTIME = Symbol('runtime');

// attributes that configure the element itself, not the store
const RESERVED = new Set(['id', 'class', 'style', 'hidden', 'is', 'src']);

const normalize = (key) => toKebabCase(String(key)).toLowerCase();

// { code: { theme: 'nord' } } -> 'code-theme'
function flatten (input, prefix = '', out = new Map()) {
  for (const [key, value] of Object.entries(input ?? {})) {
    const path = prefix ? `${prefix}-${normalize(key)}` : normalize(key);
    if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, out);
    else out.set(path, value == null ? null : String(value));
  }
  return out;
}

function mergeSources () {
  const next  = new Map();
  const apply = (entries) => {
    for (const [key, value] of entries) {
      if (value === null) next.delete(key); // explicit null revokes a key set by an earlier source
      else next.set(key, value);
    }
  };

  for (const [owner, entries] of sources) if (owner !== RUNTIME) apply(entries);
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
  for (const [key, value] of next) AufbauConfigStore.set(key, value);

  window.dispatchEvent(new CustomEvent(CONFIG_EVENT, {
    detail: { changed, config: Object.fromEntries(next) }
  }));

  return changed;
}

// :::::: PUBLIC API :::::::::::::::::::::::::::::::::::::::::::

export function getConfig (key, fallback) {
  const found = AufbauConfigStore.get(normalize(key));
  return found === undefined ? fallback : found;
}

/**
 * writes to the runtime source, null removes a key again.
 * setConfig('code-theme', 'nord') | setConfig({ code: { theme: 'nord' } })
 */
export function setConfig (keyOrMap, value) {
  const entries = sources.get(RUNTIME) ?? new Map();
  sources.set(RUNTIME, entries);

  if (typeof keyOrMap === 'string') entries.set(normalize(keyOrMap), value == null ? null : String(value));
  else for (const [key, val] of flatten(keyOrMap)) entries.set(key, val);

  commitConfig();
  return AufbauConfigStore;
}

/**
 * candidate config keys for an element attribute.
 * <aufbau-code theme> -> ['code-theme', 'aufbau-code-theme']
 */
export function configKeys (tag, name) {
  const attr = normalize(name);
  if (!tag) return [attr];

  const full  = normalize(tag);
  const short = full.replace(/^aufbau-/, '');
  return [`${short}-${attr}`, `${full}-${attr}`];
}

/** first hit wins. keys: true (auto namespace) | string | string[] */
export function resolveConfig (tag, name, keys = true) {
  const candidates =
      keys === true       ? configKeys(tag, name)
    : Array.isArray(keys) ? keys.map(normalize)
    : [normalize(keys)];

  for (const key of candidates) if (AufbauConfigStore.has(key)) return AufbauConfigStore.get(key);
  return undefined;
}

export function onConfigChange (listener) {
  window.addEventListener(CONFIG_EVENT, listener);
  return () => window.removeEventListener(CONFIG_EVENT, listener);
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
    const entries = new Map();

    // 1. remote defaults, lowest precedence
    if (this._remote) for (const [key, value] of this._remote) entries.set(key, value);

    // 2. inline json body: <aufbau-config>{"code":{"theme":"nord"}}</aufbau-config>
    const body = this.textContent.trim();
    if (body) {
      try   { for (const [key, value] of flatten(JSON.parse(body))) entries.set(key, value); }
      catch { console.warn('[aufbau-config] inline body is not valid json, ignored.'); }
    }

    // 3. attributes win, most explicit form
    for (const { name, value } of this.attributes) {
      const key = normalize(name);
      if (RESERVED.has(key)) continue;
      entries.set(key, value);
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
      console.warn(`[aufbau-config] could not load "${src}":`, error);
    }
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-config')) {
  customElements.define('aufbau-config', AufbauConfig);
}

export default AufbauConfig;
