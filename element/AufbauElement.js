// :::::: IMPORTS

import { followConfig, getConfig }           from './lib/config.js';
import { isAttribute, looseEntry, schemaOf } from './lib/schema.js';
import { applySkin }                         from './lib/skin.js';
import { adoptClassStyles }                  from './lib/styles.js';

import { hasAttr }       from '@domina/methods/hasAttr.js';
import { setAttr }       from '@domina/methods/setAttr.js';
import { setStyleToken } from '@domina/methods/setStyleToken.js';

import { coerce, toBoolean }             from '@pulgasari/coerce';
import { isFn, isPlainObject, isString } from '@pulgasari/is';
import { Logger }                        from '@pulgasari/logger';
import { toCamelCase, toKebabCase }      from '@pulgasari/str';

import { Selection, SHORTHANDS } from './Selection.js';

const log = new Logger({ prefix: 'aufbau-core' });

const notEqual = (value, old) => !Object.is(value, old);

// a property of the platform is never shadowed by a schema accessor (title, hidden, id …)
const NATIVE = new Set(Object.getOwnPropertyNames(HTMLElement.prototype).concat(Object.getOwnPropertyNames(Element.prototype)));

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
    if (!this._upgraded) this.upgradeProperties();
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
    this._cache?.delete(this.entryOf(name).name);
    if (oldValue !== newValue && this._mounted) {
      this.onAttributeChanged(name, oldValue, newValue);
      this.requestUpdate(name);
    }
  }

  static init (name) {
    const tag = (isString(name) ? name : name?.name) || toKebabCase(this.name);

    if (!tag.includes('-')) return log.warn(`invalid tag name "${tag}", custom elements require a hyphen.`);
    if (customElements.get(tag)) return;

    for (const name of this.parts ?? []) {
      Object.defineProperty(this.prototype, '$' + toCamelCase(name), { configurable: true, get () { return this.part(name); } });
    }

    // an accessor per schema entry: attributes read through getAttr() and write the
    // attribute, props store their value. a name the class or the platform already
    // has keeps its own (a hand-written setter, title, hidden …)
    for (const entry of schemaOf(this).values()) {
      const { attribute, name, type } = entry;
      if (entry.state || NATIVE.has(name) || name in this.prototype) continue;
      Object.defineProperty(this.prototype, name, {
        configurable : true,
        get () { return this.getAttr(name); },
        set (value) {
          if (entry.prop)          this.setProp(name, value);
          else if (type === Boolean) this.toggleAttribute(attribute, Boolean(value));
          else if (value == null)  this.removeAttribute(attribute);
          else                     this.setAttribute(attribute, String(value));
        },
      });
    }

    const observed = [...schemaOf(this).values()].filter(isAttribute).map(entry => entry.attribute);
    if (observed.length && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
      Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
    }

    customElements.define(tag, this);
  }

  // ::: hooks, override in subclasses

  // `changed` is the set of names (camelCase) that changed since the last update,
  // every name of the schema on the first one

  onAdopted          (oldDocument, newDocument) {}
  onAttributeChanged (name, oldValue, newValue) {}
  onConnected        () {}
  onConnectedMove    () { this.disconnectedCallback(); this.connectedCallback(); }
  onDisconnected     () {}
  onError            (error) {}
  onFirstRender      () {}
  onRender           (changed) {}
  render             () { return null; }
  sync               (changed) {}
  willUpdate         (changed) {}

  // :::::: UPDATE CYCLE ::::::::::::::::::::::::::::::::::::::::

  // a change marks its name; the update runs once per microtask with all names
  // marked meanwhile. `static batch = false` updates at once instead
  requestUpdate (name) {
    const changed = this._changed ??= new Set;
    if (name === undefined) for (const entry of this.schema.values()) changed.add(entry.name);
    else changed.add(this.entryOf(name).name);

    if (!this._mounted) return this;
    if (this.constructor.batch === false) return this.flush();
    this._pending ??= Promise.resolve().then(() => { this.flush(); return true; });
    return this;
  }

  // the pending update, now: for code that reads the dom right after a change
  flush () { return this._changed ? this.perform(this._changed) : this; }

  // resolves once the pending update ran
  get updateComplete () { return this._pending ?? Promise.resolve(true); }

  // at once, with the names marked so far plus `changed`; without `changed` every
  // name counts as changed, as a direct update() did in 2.x
  update (changed) {
    const names = new Set(this._changed);
    for (const name of changed ?? this.schema.keys()) names.add(this.entryOf(name).name);
    return this.perform(names);
  }

  perform (names) {
    if (!this._mounted) return this;

    this._changed = this._pending = null;
    this._cache?.clear();

    try {
      this.willUpdate(names);
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
      this.sync(names);
      if (rebuilt) this.onRender(names);
      if (!this._rendered) { this._rendered = true; this.onFirstRender(); }
      if (this._failed) { this._failed = false; this.states.delete('error'); }
    }
    catch (error) {
      this._failed = true;
      this.states.add('error');
      log.error(`<${this.localName}>`, error);
      this.onError(error);
    }

    return this;
  }

  // a config value of this tag changed: every name may resolve differently now
  configChanged () {
    this._cache?.clear();
    return this.requestUpdate();
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
  // an attribute the element reflected itself is no attribute of the author.
  // a prop or state entry gives its stored value. a schema value is resolved once
  // per update: the cache is cleared by every update, by a change of the attribute
  // and by a change of the config
  getAttr (name) {
    if (name === undefined) return this.attrProxy();

    const entry = this.entryOf(name);
    if (!isAttribute(entry)) return this._values?.has(entry.name) ? this._values.get(entry.name) : entry.fallback;

    const cached = this.schema.has(name);
    if (cached && this._cache?.has(entry.name)) return this._cache.get(entry.name);

    const value = this.resolveAttr(entry);
    if (cached) (this._cache ??= new Map).set(entry.name, value);
    return value;
  }

  resolveAttr ({ attribute, fallback, fn, name, type, values }) {
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

  // :::::: PROPS AND STATE :::::::::::::::::::::::::::::::::::::

  // a stored value: el.nodes = […] for a prop, setState('hover', true) for state.
  // an update follows when hasChanged (default: not Object.is) says so
  setProp (name, value) {
    const entry   = this.entryOf(name);
    const values  = this._values ??= new Map;
    const changed = entry.hasChanged ?? notEqual;
    if (values.has(entry.name) && !changed(value, values.get(entry.name))) return this;
    values.set(entry.name, value);
    return this.requestUpdate(entry.name);
  }

  setState (name, value) { return this.setProp(name, value); }

  // a value set before the element was defined, or a class field, sits on the
  // instance and hides the accessor: it is handed to the accessor instead
  upgradeProperties () {
    this._upgraded = true;
    for (const { name, state } of this.schema.values()) {
      if (state || !Object.hasOwn(this, name)) continue;
      const value = this[name];
      delete this[name];
      this[name] = value;   // without an accessor this puts it back where it was
    }
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

