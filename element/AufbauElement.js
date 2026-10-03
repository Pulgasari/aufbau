// :::::: IMPORTS

import { followConfig, getConfig } from './lib/config.js';
import { looseEntry, schemaOf }    from './lib/schema.js';
import { applySkin }               from './lib/skin.js';
import { adoptClassStyles }        from './lib/styles.js';

import { hasAttr }       from '@domina/methods/hasAttr.js';
import { setAttr }       from '@domina/methods/setAttr.js';
import { setStyleToken } from '@domina/methods/setStyleToken.js';

import { coerce, toBoolean }             from '@pulgasari/coerce';
import { isFn, isPlainObject, isString } from '@pulgasari/is';
import { Logger }                        from '@pulgasari/logger';
import { toCamelCase, toKebabCase }      from '@pulgasari/str';

import { Selection, SHORTHANDS } from './Selection.js';

const log = new Logger({ prefix: 'aufbau-core' });

const disposer = () => {
  const entries = new Set;
  return {
    add     (stop) { if (isFn(stop)) entries.add(stop); return stop; },
    dispose ()     { for (const stop of entries) { try { stop(); } catch {} } entries.clear(); },
  };
};

// the custom states of the host, :state(name) in css. toggle() is what CustomStateSet lacks
const stateSet = host => ({
  add    (name)                         { host.internals?.states.add(name);    return this; },
  delete (name)                         { host.internals?.states.delete(name); return this; },
  has    (name)                         { return Boolean(host.internals?.states.has(name)); },
  toggle (name, force = !this.has(name)) { return force ? this.add(name) : this.delete(name); },
});

// :::::: SKELETON ::::::::::::::::::::::::::::::::::::::::::::::

// loading: the leaves of the markup become blocks of their own size. an element
// that has no markup yet gets lines over its box instead (:state(blank))
const SKELETON_STYLES = `
  @keyframes aufbau-skeleton { 50% { opacity: 0.45; } }

  :state(skeleton), :host(:state(skeleton)) {
    --_color : var(--skeleton-color, color-mix(in srgb, currentColor 14%, transparent));

    animation      : aufbau-skeleton 1.4s ease-in-out infinite;
    cursor         : progress;
    pointer-events : none;
    user-select    : none;

    -webkit-text-fill-color : transparent;
  }

  :state(skeleton) :not(:has(*)), :host(:state(skeleton)) :not(:has(*), slot) {
    background-color : var(--_color);
    border-color     : transparent;
    border-radius    : var(--skeleton-radius, 0.25em);
    object-position  : -99999px;   /* an image steps aside for the block */
  }

  :state(blank), :host(:state(blank)) {
    --_line : var(--skeleton-line, 1em);
    --_gap  : var(--skeleton-gap, 0.5em);

    background      : repeating-linear-gradient(to bottom, var(--_color) 0 var(--_line), transparent 0 calc(var(--_line) + var(--_gap)));
    border-radius   : var(--skeleton-radius, 0.25em);
    min-block-size  : calc(var(--skeleton-lines, 3) * (var(--_line) + var(--_gap)) - var(--_gap));
    min-inline-size : var(--skeleton-width, 4em);
  }

  @media (prefers-reduced-motion: reduce) {
    :state(skeleton), :host(:state(skeleton)) { animation: none; }
  }
`;

export class AufbauElement extends HTMLElement {

  static attr   = { skeleton: Boolean };
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
  
  get focused      () { return this.root === this ? document.activeElement : this.root.activeElement; }
  get internals    () { if (this._internals === undefined) this._internals = this.attachInternals?.() ?? null; return this._internals; }   
  get renderTarget () { return this.root; }
  get root         () { return this.constructor.shadow && this.shadowRoot || this; }
  get states       () { return this._states ??= stateSet(this); }
  
  // :::::: SKELETON ::::::::::::::::::::::::::::::::::::::::::::

  // while the element loads. the attribute skeleton does the same from outside
  setSkeleton (on = true) {
    this._loading = Boolean(on);
    this.syncSkeleton();
    return this;
  }

  syncSkeleton () {
    const on = this._loading || this.hasAttribute('skeleton');
    this.states.toggle('skeleton', on);
    this.states.toggle('blank', on && !this.renderTarget.querySelector('*'));
    if (this.internals) this.internals.ariaBusy = on ? 'true' : null;
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  adoptedCallback (oldDocument, newDocument) { this.onAdopted(oldDocument, newDocument); }

  connectedCallback () {
    this._mounted = true;
    adoptClassStyles(this.constructor, this.root === this ? this.getRootNode() : this.root);
    applySkin();
    this.track(followConfig(this));
    this.onConnected();
    this.update();
  }
  
  disconnectedCallback () {
    this._mounted = false;
    this.release();
    this.onDisconnected();
  }

  
  // without the hook a move is what it is without this callback: disconnected, then connected
  connectedMoveCallback () { this.onConnectedMove(); }

  attributeChangedCallback (name, oldValue, newValue) {
    if (this._reflecting) return;
    this._reflected?.delete(name);   // written by the author now
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

    const observed = [...schemaOf(this).values()].map(entry => entry.attribute);
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
    for (const name of this.constructor.reflect ?? []) {
      const { attribute } = this.entryOf(name);
      const value = this.getAttr(name);

      let text = String(value);
      if (value === true) text = '';
      if (value == null || value === false) text = null;
      if (this.getAttribute(attribute) === text) continue;

      this._reflecting = true;
      try     { text === null ? this.removeAttribute(attribute) : this.setAttribute(attribute, text); }
      finally { this._reflecting = false; }

      (this._reflected ??= new Set).add(attribute);
    }
    return this;
  }

  invalidate () { this._markup = undefined; return this; }

  // :::::: SCHEMA ::::::::::::::::::::::::::::::::::::::::::::::

  get schema () { return schemaOf(this.constructor); }

  // the schema entry of a name in any case, a loose one outside the schema
  entryOf (name) { return this.schema.get(name) ?? looseEntry(name); }

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

  // the attribute, else the config tag-attribute, else the default. getAttr() gives all of them.
  // an attribute the element reflected itself is no attribute of the author
  getAttr (name) {
    if (name === undefined) return this.attrProxy();

    const { attribute, fallback, fn, type, values } = this.entryOf(name);
    const authored   = this.hasAttribute(attribute) && !this._reflected?.has(attribute);
    const configured = () => getConfig(`${this.localName}-${attribute}`);

    if (type === Boolean) {
      if (authored) return true;
      const value = configured();
      return value === undefined ? (fallback ?? false) : toBoolean(value);
    }

    const raw = authored ? this.getAttribute(attribute) : configured();
    if (raw == null) return fallback;

    let value = coerce(raw, type, fallback);
    if (values && !values.includes(value)) value = fallback;

    if (fn) {
      try   { value = fn.call(this, value, name); }
      catch { value = fallback; }
    }

    return value;
  }

  // const { label, size } = this.getAttr()
  attrProxy () {
    const names = [...this.schema.values()].map(entry => entry.name);

    return new Proxy({}, {
      get     : (target, prop) => isString(prop) ? this.getAttr(prop) : undefined,
      has     : (target, prop) => isString(prop) && this.hasAttr(prop),
      ownKeys : () => names,
      getOwnPropertyDescriptor: () => ({ configurable: true, enumerable: true }),
    });
  }

  // :::::: STYLE VARS :::::::::::::::::::::::::::::::::::::::::::

  // custom properties on the host: setVar('--size', '2em') or setVar({ '--size': '2em' }).
  // a name without -- gets it, null and false remove it
  setVar (nameOrMap, value) { setStyleToken(this, nameOrMap, value); return this; }

  // attributes with `var` in their schema are mirrored as custom properties
  applyVars () {
    for (const entry of this.schema.values()) {
      if (entry.var) this.setVar(entry.var, this.getAttr(entry.name));
    }
  }

  // :::::: TREE ::::::::::::::::::::::::::::::::::::::::::::::::

  // static parts = ['close'] gives this.$close, see init()
  get self () { return Selection.of([this], { owner: this, signal: this.signal }); }

  $     (target)   { return this.self.$     (target);   }
  $$    (selector) { return this.self.$$    (selector); }
  part  (name)     { return this.self.part  (name);     }
  parts (name)     { return this.self.parts (name);     }

}

for (const name of Object.keys(SHORTHANDS)) {
  AufbauElement.prototype[name] = function (handler, options) { this.self[name](handler, options); return this; };
}

export default AufbauElement;

