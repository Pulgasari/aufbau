  // @aufbau/elements/core/AufbauCore.js

// :::::: IMPORTS

import { BASE, schemaOf }   from './schema.js';
import { applySkin }        from './skin.js';
import { adoptClassStyles } from './styles.js';
import { canonicalKey, CONFIG_EVENT, configKeys, resolveConfig } from './AufbauConfig.js';

import { delegateEvent }  from '@domina/methods/delegateEvent.js';
import { emitEvent }      from '@domina/methods/emitEvent.js';
import { getElement }     from '@domina/methods/getElement.js';
import { getElementById } from '@domina/methods/getElementById.js';
import { getElements }    from '@domina/methods/getElements.js';
import { hasAttr }        from '@domina/methods/hasAttr.js';
import { offEvent }       from '@domina/methods/offEvent.js';
import { onEvent }        from '@domina/methods/onEvent.js';
import { setAttr }        from '@domina/methods/setAttr.js';

import { coerce, toBoolean }                      from '@pulgasari/coerce';
import { isArray, isFn, isPlainObject, isString } from '@pulgasari/is';
import { toCamelCase, toKebabCase }               from '@pulgasari/str';
import { Logger }                                 from '@pulgasari/logger';

const log = new Logger({ prefix: 'aufbau-core' });

// :::::: DECORATION

// non-enumerable definition, keeps the descriptor boilerplate in one place
const define = (target, props) => {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, { value, configurable: true, writable: true });
  }
  return target;
};

const decorated = new WeakSet;

function decorate (target) {
  if (!target || decorated.has(target)) return target;
  decorated.add(target);

  return define(target, {
    on  (...args) { return onEvent  (this, ...args); },
    off (...args) { return offEvent (this, ...args); }
  });
}

function decorateAll (list) {
  const items = list.map(decorate);

  return define(items, {
    on (...args) {
      const unsubs = items.map(item => item.on(...args));
      return () => unsubs.forEach(unsub => unsub());
    },
    off (...args) {
      items.forEach(item => item.off(...args));
      return items;
    }
  });
}

const disposer = () => {
  const entries = new Set;
  return {
    add      (stop) { if (isFn(stop)) entries.add(stop); return stop; },
    dispose  ()     { for (const stop of entries) { try { stop(); } catch {} } entries.clear(); },
    get size ()     { return entries.size; }
  };
};



export const AufbauCore = (BaseClass = HTMLElement) => {
return class extends BaseClass {

  constructor () {
    super();
    this._effects = disposer();
    this._mounted = false;
  }
  
  get root         () { return this.shadowRoot ?? this; }
  get renderTarget () { return this.root; }
  
  shell (className, { prepend = false } = {}) {
    if (this._shell?.isConnected) return this._shell;

    this._shell = this.querySelector(`:scope > .${className}`);
    if (!this._shell) {
      this._shell = document.createElement('div');
      this._shell.className = className;
    }
    if (!this._shell.isConnected) this[prepend ? 'prepend' : 'append'](this._shell);

    return this._shell;
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  connectedCallback () {
    this._mounted = true;
    adoptClassStyles(this.constructor, this.root); // lazy on purpose: an imported but unused element must not adopt anything    
    applySkin();
    this.on(window, CONFIG_EVENT, (event) => {
      if (this._mounted && this.observesConfig(event.detail?.changed)) this.update();
    });
    this.onMount();
    this.update();
  }
  
  disconnectedCallback () {
    this._mounted = false;
    this.release();
    this.onUnmount();
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue !== newValue && this._mounted) {
      this.onAttributeChange(name, oldValue, newValue);
      this.update();
    }
  }

  static init (options) {
    const tagName    = isString      (options) ? options         : options?.name;
    const extendsTag = isPlainObject (options) ? options.extends : this.extendsTag;
    const name       = tagName || toKebabCase(this.name);
    
    if (!name || !name.includes('-')) return log.warn(`invalid tag name "${name}", custom elements require a hyphen.`);    
    if (customElements.get(name)) return;

    // schema keys are already kebab-case, so they map 1:1 onto observedAttributes
    const observed = Object.keys(schemaOf(this));
    if (observed.length && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
      Object.defineProperty (this, 'observedAttributes', { configurable: true, get: () => observed });
    }

    customElements.define(name, this, extendsTag ? { extends: extendsTag } : undefined);
  }

  // ::: hooks, override in subclasses

  onAttributeChange (name, oldValue, newValue) {}
  onMount   () {}
  onUnmount () {}
  onRender  () {}
  render    () { return null; }
  sync      () {}

  /**
   * the render pipeline. structure is only rebuilt when render() actually
   * produces different markup, otherwise every keystroke would drop focus and
   * caret position out of the inner fields. sync() runs on every pass,
   * onRender() only when the nodes are actually new.
   */
  update () {
    if (!this._mounted) return this;

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
    this.sync();
    if (rebuilt) this.onRender();

    return this;
  }

  /** forces the next update() to rebuild the markup even if it is unchanged */
  invalidate () { this._markup = undefined; return this; }

  // :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::
  
  get schema () { return schemaOf(this.constructor); }
  get tag    () { return this.getAttribute('is') || this.localName; }

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

    //return this.getAttr(name) ?? resolveConfig(this.tag, name) ?? fallback;
  }

  // resolved gesture mode for this element — 'auto' | 'true' | 'false'.
  // precedence: the element's own `gestures` attribute, then a tag-scoped config
  // (`<tag>-gestures`), then the global `gestures` config, then 'auto'. elements
  // that carry gesture behaviour consult this, so a page can switch every gesture
  // off with a single `<aufbau-config gestures="false">` (or per element / tag).
  gesturesMode () {
    return String(this.getConfig('gestures', 'auto', [...configKeys(this.tag, 'gestures'), 'gestures']));
  }

  // :::::: EVENTS ::::::::::::::::::::::::::::::::::::::::::::::

  on (...args) {
    const [first, second, third, fourth] = args;

    // delegated: type first, selector second. dom.delegate takes
    // (container, types, selector, fn), so the order carries straight through
    if (isString(first) && isString(second) && isFn(third)) {
      return this.track(delegateEvent(this, first, second, third, fourth));
    }

    // the element itself
    if (isString(first) && isFn(second)) {
      return this.track(onEvent(this, first, second, third));
    }

    // any external event target or iterable of targets
    if (!first) return () => {};
    return this.track(onEvent(first, second, third, fourth));
  }

  off  (...args) { offEvent(this, ...args); return this; }
  emit (...args) { return emitEvent(this, ...args); }

  onOutside (handler, { type = 'pointerdown' } = {}) {
    return this.on(document, type, (event) => {
      if (!event.composedPath().includes(this)) handler(event);
    });
  }

  release ()            { this._effects.dispose(); return this; }
  track   (unsubscribe) { return this._effects.add(unsubscribe); }

  // :::::: ATTRIBUTES ::::::::::::::::::::::::::::::::::::::::::

  hasAttr (name) { return hasAttr(this, name); }
  setAttr (map)  { setAttr(this, map); return this; }

  getAttr (nameOrType, type, fallback) {
    if (!isString(nameOrType)) return this._attrProxy(isFn(nameOrType) ? nameOrType : null);

    const kebab  = toKebabCase(nameOrType);
    const parsed = this.schema[kebab] ?? BASE;

    const finalType     = isFn(type) ? type : parsed.type;
    const finalFallback = fallback !== undefined ? fallback : parsed.fallback;
    const fromConfig    = () => parsed.config ? resolveConfig(this.tag, kebab, parsed.config) : undefined;

    // booleans: attribute presence first, then config, then fallback
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
  // css custom properties on the element, the getAttr/setAttr counterpart.
  // names are managed: a leading `--` is optional and the `varPrefix` config
  // (default 'aufbau') is inserted, so `item-size` -> `--aufbau-item-size`.
  // get reads the resolved value.

  // '' when disabled, else the prefix segment ('aufbau' by default)
  varPrefix () {
    const raw = this.getConfig('varPrefix', 'aufbau', [...configKeys(this.tag, 'varPrefix'), 'var-prefix']);
    return raw === false || raw === 'false' ? '' : raw === true || raw === 'true' ? 'aufbau' : String(raw);
  }

  cssVar (name) {
    const base   = name.startsWith('--') ? name.slice(2) : name;
    const prefix = this.varPrefix();
    return `--${prefix && base !== prefix && !base.startsWith(`${prefix}-`) ? `${prefix}-${base}` : base}`;
  }

  getVar (name, fallback) {
    const value = getComputedStyle(this).getPropertyValue(this.cssVar(name)).trim();
    return value || fallback;
  }

  getVars (names = []) {
    const style = getComputedStyle(this);
    const out   = {};
    for (const name of names) out[name] = style.getPropertyValue(this.cssVar(name)).trim() || undefined;
    return out;
  }

  setVar (name, value) {
    if (value == null || value === false || value === '') this.style.removeProperty(this.cssVar(name));
    else this.style.setProperty(this.cssVar(name), String(value));
    return this;
  }

  setVars (map) {
    for (const name in map) this.setVar(name, map[name]);
    return this;
  }

  // reflect every `var`-flagged attribute onto its css custom property
  applyVars () {
    for (const [name, entry] of Object.entries(this.schema)) {
      if (entry.var) this.setVar(entry.var === true ? name : entry.var, this.getAttr(name));
    }
  }
  

  // :::::: CHILDREN REFS :::::::::::::::::::::::::::::::::::::::

  get $ () {
    const root    = this.root;
    const findOne = spec => decorate(getElement(spec, root));
  
    return new Proxy(findOne, {
      apply: (target, thisArg, args) => findOne(...args),
      get (target, prop) {
        if (prop in target)  return target[prop];
        if (!isString(prop)) return undefined;
        return decorate(getElementById(toKebabCase(prop), root) ?? getElementById(prop, root));
      }
    });
  }
  
  get $$ () {
    return spec => decorateAll(getElements(spec, this.root));
  }

};};

export default AufbauCore;

/*

-- configWatchlist()
config keys this element depends on. null means: react to any change.
stored in the config store's canonical form, because that is the form the change list arrives in

-- onOutside
fires when an interaction happens anywhere but inside this element.
composedPath() is used on purpose, it sees through shadow roots.

-- onRender()
runs after a real markup rebuild only, for work that rewrites the new nodes

-- render()
structure, without values. return null to opt out of markup entirely

-- renderTarget()
where render() output goes. defaults to the whole root, so a plain element
simply owns its markup. containers that must keep their light dom children
alive (picker, upload, reader …) override this with a dedicated shell.

-- root()
shadow root when present, the element itself otherwise 

-- shell()
lazily creates a dedicated render shell inside the element, so authored
light dom children are never wiped by a re-render. override renderTarget
with `this.shell('aufbau-picker-ui')` to opt in.

-- sync()
values and state, applied to the structure render() produced

*/
