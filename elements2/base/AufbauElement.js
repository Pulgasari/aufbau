// :::::: IMPORTS

import { BASE, schemaOf }                                        from '../lib/schema.js';
import { applySkin }                                             from '../lib/skin.js';
import { adoptClassStyles }                                      from '../lib/styles.js';
import { canonicalKey, CONFIG_EVENT, configKeys, resolveConfig } from '../lib/config.js';

import { hasAttr } from '@domina/methods/hasAttr.js';
import { setAttr } from '@domina/methods/setAttr.js';

import { coerce, toBoolean }                      from '@pulgasari/coerce';
import { isArray, isFn, isPlainObject, isString } from '@pulgasari/is';
import { toCamelCase, toKebabCase }               from '@pulgasari/str';
import { Logger }                                 from '@pulgasari/logger';

import { Selection, SHORTHANDS } from './Selection.js';

const isBlank   = sth => sth === undefined || sth === null || sth === false || sth === '';
const isDefined = sth => sth !== undefined;
const log       = new Logger({ prefix: 'aufbau-core' });

const disposer = () => {
  const entries = new Set;
  return {
    add     (stop) { if (isFn(stop)) entries.add(stop); return stop; },
    dispose ()     { for (const stop of entries) { try { stop(); } catch {} } entries.clear(); },
  };
};

const stateSet = (host) => ({
  add    (name)        { try { host.internals?.states?.add(name);    } catch {} return this; },
  delete (name)        { try { host.internals?.states?.delete(name); } catch {} return this; },
  has    (name)        { try { return Boolean(host.internals?.states?.has(name)); } catch { return false; } },
  toggle (name, force) { return (force ?? !this.has(name)) ? this.add(name) : this.delete(name); },
});

// :::::: SKELETON ::::::::::::::::::::::::::::::::::::::::::::::

const SKELETON_STYLES = `
  @keyframes aufbau-skeleton { 50% { opacity: 0.45; } }

  :state(skeleton),
  :host(:state(skeleton)) {
    --_line : var(--skeleton-line, 1em);
    --_gap  : var(--skeleton-gap, 0.5em);

    animation       : aufbau-skeleton 1.4s ease-in-out infinite;
    background      : repeating-linear-gradient(to bottom,
                        var(--skeleton-color, color-mix(in srgb, currentColor 14%, transparent)) 0 var(--_line),
                        transparent 0 calc(var(--_line) + var(--_gap)));
    border-radius   : var(--skeleton-radius, 0.25em);
    cursor          : progress;
    min-block-size  : calc(var(--skeleton-lines, 1) * (var(--_line) + var(--_gap)) - var(--_gap));
    min-inline-size : var(--skeleton-width, 4em);
    pointer-events  : none;
    user-select     : none;

    -webkit-text-fill-color : transparent;
  }

  :state(skeleton) > *,
  :host(:state(skeleton)) *,
  :host(:state(skeleton)) ::slotted(*) { visibility: hidden; }

  @media (prefers-reduced-motion: reduce) {
    :state(skeleton), :host(:state(skeleton)) { animation: none; }
  }
`;

const SKELETON_VARS = { gap: 'gap', line: 'line', lines: 'lines', radius: 'radius', width: 'width' };

export class AufbauElement extends HTMLElement {

  static attr = { skeleton: Boolean };

  static styles = SKELETON_STYLES;

  constructor () {
    super();
    this._effects = disposer();
    this._mounted = false;

    const shadow = this.constructor.shadow;
    if (shadow && !this.shadowRoot) this.attachShadow({ mode: 'open', ...(isPlainObject(shadow) ? shadow : {}) });

    const defaults = this.constructor.internals;
    if (defaults && this.internals && isPlainObject(defaults)) Object.assign(this.internals, defaults);
  }

  get internals () {
    if (this._internals === undefined) this._internals = this.attachInternals?.() ?? null;
    return this._internals;
  }

  get states () { return this._states ??= stateSet(this); }

  get root         () { return this.constructor.shadow && this.shadowRoot || this; }
  get renderTarget () { return this.root; }

  get focused () { return this.root === this ? document.activeElement : this.root.activeElement; }

  // :::::: SKELETON ::::::::::::::::::::::::::::::::::::::::::::

  setSkeleton (on = true) {
    this._skeleton = Boolean(on);
    this.syncSkeleton();
    return this;
  }

  syncSkeleton () {
    const on = Boolean(this._skeleton || this.getAttr('skeleton'));
    if (!on && !this._skeletonShown) return;
    this._skeletonShown = on;

    this.states.toggle('skeleton', on);
    if (this.internals) this.internals.ariaBusy = on ? 'true' : null;

    const shape = this.constructor.skeleton;
    let options = {};
    if (isFn(shape))          options = shape.call(this);
    if (isPlainObject(shape)) options = shape;

    for (const [key, name] of Object.entries(SKELETON_VARS)) {
      const value = on ? options[key] : undefined;
      if (value == null) this.style.removeProperty(`--skeleton-${name}`);
      else this.style.setProperty(`--skeleton-${name}`, String(value));
    }
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  connectedCallback () {
    this._mounted = true;
    adoptClassStyles(this.constructor, this.root === this ? this.getRootNode() : this.root);
    applySkin();
    this.$(window).on(CONFIG_EVENT, event => { if (this._mounted && this.observesConfig(event.detail?.changed)) this.update(); });
    this.onConnected();
    this.update();
  }
  
  disconnectedCallback () {
    this._mounted = false;
    this.release();
    this.onDisconnected();
  }

  adoptedCallback (oldDocument, newDocument) { this.onAdopted(oldDocument, newDocument); }

  // without the hook a move is what it is without this callback: disconnected, then connected
  connectedMoveCallback () { this.onConnectedMove(); }

  attributeChangedCallback (name, oldValue, newValue) {
    if (this._reflecting) return;
    if (oldValue !== newValue && this._mounted) {
      this.onAttributeChanged(name, oldValue, newValue);
      this.update();
    }
  }

  static init (name) {
    const tag = (isString(name) ? name : name?.name) || toKebabCase(this.name);

    if (!tag.includes('-')) return log.warn(`invalid tag name "${tag}", custom elements require a hyphen.`);
    if (customElements.get(tag)) return;

    for (const name of this.parts ?? []) {
      Object.defineProperty(this.prototype, '$' + toCamelCase(name), { configurable: true, get () { return this.part(name); } });
    }

    const observed = Object.keys(schemaOf(this));
    if (observed.length && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
      Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
    }

    customElements.define(tag, this);
  }

  // ::: hooks, override in subclasses

  onAdopted          (oldDocument, newDocument) {}
  onAttributeChanged (name, oldValue, newValue) {}
  onConnected        () {}
  onConnectedMove    () { this.disconnectedCallback(); this.connectedCallback(); }
  onDisconnected     () {}
  onRender           () {}
  render             () { return null; }
  sync               () {}

  update () {
    if (!this._mounted) return this;

    this.reflectAttrs();

    const markup = this.render();
    let rebuilt  = false;

    if (markup != null) {
      const next = String(markup);
      if (next !== this._markup) {
        this._markup = next;
        this.renderTarget.innerHTML = next;
        rebuilt = true;
      }
    }

    this.applyVars();
    this.syncSkeleton();
    this.sync();
    if (rebuilt) this.onRender();

    return this;
  }

  reflectAttrs () {
    const names = this.constructor.reflect;
    if (!isArray(names)) return this;

    for (const name of names) {
      const kebab = toKebabCase(name);
      const value = this.getAttr(name);
      let text = String(value);
      if (value === true) text = '';
      if (value == null || value === false) text = null;

      if (this.getAttribute(kebab) === text) continue;

      this._reflecting = true;
      try   { text === null ? this.removeAttribute(kebab) : this.setAttribute(kebab, text); }
      finally { this._reflecting = false; }
    }

    return this;
  }

  invalidate () { this._markup = undefined; return this; }

  // :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::
  
  get schema () { return schemaOf(this.constructor); }
  get tag    () { return this.localName; }

  get configWatchlist () {
    if (this._configWatchlist !== undefined) return this._configWatchlist;

    const explicit = this.constructor.observedConfig;
    if (isArray(explicit)) return (this._configWatchlist = new Set(explicit.map(canonicalKey)));

    const keys = new Set;
    for (const [name, { config }] of Object.entries(this.schema)) {
      if (!config) continue;
      if (config === true) configKeys(this.tag, name).forEach(key => keys.add(canonicalKey(key)));
      else config.forEach(key => keys.add(canonicalKey(key)));
    }

    return (this._configWatchlist = keys.size ? keys : null);
  }

  observesConfig (changed) {
    const watchlist = this.configWatchlist;
    if (!watchlist || !isArray(changed)) return true;
    return changed.some(key => watchlist.has(canonicalKey(key)));
  }

  getConfig (name, fallback, keys = true) {
    const kebab = toKebabCase(name);
    if (this.hasAttribute(kebab)) return this.getAttribute(kebab);

    const found = resolveConfig(this.tag, kebab, keys);
    return found === undefined ? fallback : found;

  }

  gesturesMode () {
    return String(this.getConfig('gestures', 'auto', [...configKeys(this.tag, 'gestures'), 'gestures']));
  }

  // :::::: EVENTS ::::::::::::::::::::::::::::::::::::::::::::::

  // aborted on disconnect, a new one after
  get signal () {
    if (!this._controller || this._controller.signal.aborted) this._controller = new AbortController;
    return this._controller.signal;
  }

  on   (...args) { this.self.on(...args); return this; }
  emit (...args) { return this.self.emit(...args); }

  release () {
    this._controller?.abort();
    this._effects.dispose();
    return this;
  }

  // anything else to undo on disconnect: an observer, a timer
  track (stop) { return this._effects.add(stop); }

  // :::::: ATTRIBUTES ::::::::::::::::::::::::::::::::::::::::::

  hasAttr (name) { return hasAttr(this, name); }
  setAttr (map)  { setAttr(this, map); return this; }

  getAttr (nameOrType, type, fallback) {
    if (!isString(nameOrType)) return this._attrProxy(isFn(nameOrType) ? nameOrType : null);

    const kebab  = toKebabCase(nameOrType);
    const parsed = this.schema[kebab] ?? BASE;

    const finalType     = isFn(type)          ? type     : parsed.type;
    const finalFallback = isDefined(fallback) ? fallback : parsed.fallback;
    const fromConfig    = () => parsed.config ? resolveConfig(this.tag, kebab, parsed.config) : undefined;

    if (finalType === Boolean) {
      if (this.hasAttribute(kebab)) return true;
      const configured = fromConfig();
      return configured === undefined ? (finalFallback ?? false) : toBoolean(configured);
    }

    const raw = this.hasAttribute(kebab) ? this.getAttribute(kebab) : fromConfig();
    if (raw == null) return finalFallback;

    let value = coerce(raw, finalType, finalFallback);

    if (parsed.values && !parsed.values.includes(value)) value = finalFallback;

    if (parsed.fn) {
      try   { value = parsed.fn.call(this, value, nameOrType); }
      catch { value = finalFallback; }
    }

    return value;
  }

  _attrProxy (overrideType) {
    const names = Object.keys(this.schema);

    return new Proxy({}, {
      get     : (target, prop) => isString(prop) ? this.getAttr(prop, overrideType) : undefined,
      has     : (target, prop) => isString(prop) && this.hasAttr(prop),
      ownKeys : () => names.map(toCamelCase),
      getOwnPropertyDescriptor: () => ({ configurable: true, enumerable: true }),
    });
  }

  // :::::: STYLE VARS :::::::::::::::::::::::::::::::::::::::::::

  // custom properties on the host. '--name' as it is, 'name' as --aufbau-name.
  // null, undefined, false and '' remove it
  setVar (name, value) {
    const property = name.startsWith('--') ? name : `--aufbau-${name}`;
    if (isBlank(value)) this.style.removeProperty(property);
    else this.style.setProperty(property, String(value));
    return this;
  }

  setVars (map) {
    for (const name in map) this.setVar(name, map[name]);
    return this;
  }

  // attributes with `var` in their schema are mirrored as custom properties
  applyVars () {
    for (const [name, entry] of Object.entries(this.schema)) {
      if (entry.var) this.setVar(entry.var === true ? name : entry.var, this.getAttr(name));
    }
  }

  // :::::: TREE ::::::::::::::::::::::::::::::::::::::::::::::::

  // static parts = ['close'] gives this.$close, see init()
  get self () { return Selection.of([this], { owner: this, signal: this.signal }); }

  $     (target)   { return this.self.$(target); }
  $$    (selector) { return this.self.$$(selector); }
  part  (name)     { return this.self.part(name); }
  parts (name)     { return this.self.parts(name); }

}

for (const name of Object.keys(SHORTHANDS)) {
  AufbauElement.prototype[name] = function (handler, options) { this.self[name](handler, options); return this; };
}

export default AufbauElement;

