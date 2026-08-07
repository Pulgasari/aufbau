  // @aufbau/elements/core/AufbauCore.js

// :::::: IMPORTS

import { BASE, schemaOf }        from './schema.js';
import { CONFIG_EVENT, configKeys, resolveConfig } from './AufbauConfig.js';

import {
  dom, //delegate, disposer, emitEvent, offEvent, onEvent
  coerce, createLogger, 
  isArray, isFn, isPlainObject, isString,
  toBoolean, toCamelCase, toKebabCase,
} from '@aufbau/js';

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
    on  (...args) { return dom.onEvent  (this, ...args); },
    off (...args) { return dom.offEvent (this, ...args); }
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








const log = createLogger('aufbau-core');

export const AufbauCore = (BaseClass = HTMLElement) => {
return class extends BaseClass {

  constructor () {
    super();
    this._mounted = false;
    this._effects = dom.disposer();
  }
  
  /** shadow root when present, the element itself otherwise */
  get root () { return this.shadowRoot ?? this; }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  connectedCallback () {
    this._mounted = true;
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

  /**
   * registers the custom element. safe to call twice, hmr re-imports are a no-op.
   * @param {string|{name?: string, extends?: string}} [options]
   */
  static init (options) {
    const tagName    = isString(options)      ? options : options?.name;
    const extendsTag = isPlainObject(options) ? options.extends : this.extendsTag;

    const name = tagName || toKebabCase(this.name);
    if (!name || !name.includes('-')) {
      return log.warn(`invalid tag name "${name}", custom elements require a hyphen.`);
    }

    // schema keys are already kebab-case, so they map 1:1 onto observedAttributes
    const observed = Object.keys(schemaOf(this));
    if (observed.length && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
      Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
    }

    if (customElements.get(name)) return;
    customElements.define(name, this, extendsTag ? { extends: extendsTag } : undefined);
  }

  // ::: hooks, override in subclasses

  onAttributeChange (name, oldValue, newValue) {}
  onMount   () {}
  onUnmount () {}
  update    () {}

  // :::::: CONFIG ::::::::::::::::::::::::::::::::::::::::::::::

  /** works for customized built-ins too: <datalist is="aufbau-datalist"> -> 'aufbau-datalist' */
  get tag () {
    return this.getAttribute('is') || this.localName;
  }

  /**
   * parsed schema, keyed by kebab-case attribute name. parsing happens once per
   * class inside schemaOf(), this getter is a weakmap hit.
   * always an object, empty when the class declares no `static attr`.
   */
  get schema () {
    return schemaOf(this.constructor);
  }

  /** config keys this element depends on. null means: react to any change */
  get configWatchlist () {
    if (this._configWatchlist !== undefined) return this._configWatchlist;

    const explicit = this.constructor.observedConfig;
    if (isArray(explicit)) return (this._configWatchlist = new Set(explicit.map(toKebabCase)));

    const keys = new Set;
    for (const [name, { config }] of Object.entries(this.schema)) {
      if (!config) continue;
      if (config === true) configKeys(this.tag, name).forEach(key => keys.add(key));
      else config.forEach(key => keys.add(toKebabCase(key)));
    }

    return (this._configWatchlist = keys.size ? keys : null);
  }

  observesConfig (changed) {
    const watchlist = this.configWatchlist;
    if (!watchlist || !isArray(changed)) return true;
    return changed.some(key => watchlist.has(key));
  }

  getConfig (name, fallback, keys = true) {
    const kebab = toKebabCase(name);
    if (this.hasAttribute(kebab)) return this.getAttribute(kebab);

    const found = resolveConfig(this.tag, kebab, keys);
    return found === undefined ? fallback : found;
  }

  // :::::: EVENTS ::::::::::::::::::::::::::::::::::::::::::::::

  /**
   * every binding is tracked and released on disconnect.
   *
   *   on('click', fn)                -> the element itself
   *   on('click', '.btn', fn)        -> delegated, survives innerHTML re-renders
   *   on(target, 'click', fn)        -> external target (window, document, Audio, node list …)
   *
   * delegated listeners receive (event, matchedElement) with `this` bound to the match.
   * @returns {() => void} unsubscribe
   */
  on (...args) {
    const [first, second, third, fourth] = args;

    // delegated: type first, selector second
    if (isString(first) && isString(second) && isFn(third)) {
      return this.track(dom.delegate(this, second, first, third, fourth));
    }

    // the element itself
    if (isString(first) && isFn(second)) {
      return this.track(dom.onEvent(this, first, second, third));
    }

    // any external event target or iterable of targets
    if (!first) return () => {};
    return this.track(dom.onEvent(first, second, third, fourth));
  }

  off  (...args) { dom.offEvent(this, ...args); return this; }
  emit (...args) { return dom.emitEvent(this, ...args); }

  release () { this._effects.dispose(); return this; }
  track   (unsubscribe) { return this._effects.add(unsubscribe); }

  // :::::: ATTRIBUTES ::::::::::::::::::::::::::::::::::::::::::

  hasAttr (name) { return this.hasAttribute(toKebabCase(name)); }

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
  setAttr (map) { dom.setAttr(this, map); return this; }

  // :::::: CHILDREN REFS :::::::::::::::::::::::::::::::::::::::

  get $ () {
    const root    = this.root;
    const findOne = spec => decorate(dom.getElement(spec, root));
  
    return new Proxy(findOne, {
      apply: (target, thisArg, args) => findOne(...args),
      get (target, prop) {
        if (prop in target)  return target[prop];
        if (!isString(prop)) return undefined;
        return decorate(dom.getElementById(toKebabCase(prop), root) ?? dom.getElementById(prop, root));
      }
    });
  }
  
  get $$ () {
    return spec => decorateAll(dom.getElements(spec, this.root));
  }

};};

export default AufbauCore;
