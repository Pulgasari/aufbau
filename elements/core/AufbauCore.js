// @aufbau/elements/core/AufbauCore.js

import { toKebabCase }       from './utils.js';
import { parseSchemaEntry }  from './parseSchemaEntry.js';
import { AufbauConfigStore } from './AufbauConfig.js';

// Internal decorator helpers...
const decorateElement = (el) => {
  if (!el || el._aufbauDecorated) return el;

  Object.defineProperties(el, {
    _aufbauDecorated: { value: true, configurable: true },
    on: {
      value (...args) {
        this.addEventListener(...args);
        return () => this.removeEventListener(...args);
      },
      writable: true, configurable: true
    },
    off: {
      value (...args) {
        this.removeEventListener(...args);
        return this;
      },
      writable: true, configurable: true
    }
  });

  return el;
};

const decorateArray = (arr) => {
  Object.defineProperties(arr, {
    on: {
      value (...args) {
        const unsubs = this.map(el => el.on?.(...args) ?? (() => {}));
        return () => unsubs.forEach(unsub => unsub());
      },
      writable: true, configurable: true
    },
    off: {
      value (...args) {
        this.forEach(el => el.off?.(...args));
        return this;
      },
      writable: true, configurable: true
    }
  });

  return arr;
};

/**
 * Mixin that injects all Aufbau framework powers into any HTML base class.
 */
export const AufbauCore = (BaseClass = HTMLElement) => {return class extends BaseClass {     

  constructor () {
    super();
    this._mounted = false;
  }

  // ::: lifecycle

  connectedCallback () {
    this._mounted = true;
    this._onConfigChange = () => { if (this._mounted) this.update(); };
    window.addEventListener('aufbau-config-changed', this._onConfigChange);
    this.onMount();
    this.update();
  }

  disconnectedCallback () {
    this._mounted = false;
    if (this._onConfigChange) window.removeEventListener('aufbau-config-changed', this._onConfigChange);
    this.onUnmount();
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue !== newValue && this._mounted) {
      this.onAttributeChange(name, oldValue, newValue);
      this.update();
    }
  }
  
  /**
   * Registers the custom element safely and maps static attr schema to observedAttributes.
   * @param {string} [tagName] - Optional explicit tag name
   */
  static init (tagName) {
    // build tagName if none is provided
    const name = tagName || toKebabCase(this.name);
    // check tagName for containing hyphen (-)
    if (!name || !name.includes('-')) {
      console.warn(`[Aufbau] Invalid tag name "${name}". Custom elements require a hyphen.`);
      return;
    }
    // Map 'static attr' (Array OR Object schema) to native 'observedAttributes'
    if (this.attr && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
      const observed = Array.isArray(this.attr) ? this.attr.map(toKebabCase) : Object.keys(this.attr).map(toKebabCase);
      Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
    }
    // register AufbauElement
    if (!customElements.get(name)) customElements.define(name, this);
  }


  // ::: lifecycle hooks (override in subclasses)

  onAttributeChange (name, oldValue, newValue) {}
  onMount   () {}
  onUnmount () {}
  update    () {}

  // ::: config

  getConfig (attrName, configKey, defaultValue) {
    if (this.hasAttribute(attrName)) return this.getAttribute(attrName);

    const globalKey = (configKey || attrName).toLowerCase();
    if (AufbauConfigStore.has(globalKey)) return AufbauConfigStore.get(globalKey);

    return defaultValue;
  }

  // ::: events

  /**
   * Universal event listener with automatic unsubscribe cleanup.
   * 
   * Self:    this.on('click', handler)
   * External: this.on(this._audio, 'timeupdate', handler)
   * Window:   this.on(window, 'resize', handler)
   * Selector: this.on('.btn-play', 'click', handler)
   */
  on (...args) {
    // 1. Standard usage on self: this.on('click', listener, options)
    if (typeof args[0] === 'string') {
      const [type, listener, options] = args;
      this.addEventListener(type, listener, options);
      return () => this.removeEventListener(type, listener, options);
    }

    // 2. External usage: this.on(target, type, listener, options)
    const [rawTarget, type, listener, options] = args;
    if (!rawTarget) return () => {};

    // Resolve target (Selector string, NodeList/Array, or EventTarget/Audio/window)
    let targets = [];
    if (typeof rawTarget === 'string') {
      const root = this.shadowRoot || this;
      targets = Array.from(root.querySelectorAll(rawTarget));
    } else if (Array.isArray(rawTarget) || rawTarget instanceof NodeList) {
      targets = Array.from(rawTarget);
    } else {
      targets = [rawTarget];
    }

    // Attach listeners and collect cleanup functions
    const unsubs = targets.filter(Boolean).map(target => {
      // Use existing decorated .on() if present, otherwise fallback to addEventListener
      if (typeof target.on === 'function' && target !== this) {
        return target.on(type, listener, options);
      }
      target.addEventListener(type, listener, options);
      return () => target.removeEventListener(type, listener, options);
    });

    return () => unsubs.forEach(unsub => unsub());
  }

  on (...args) {
    this.addEventListener(...args);
    return () => this.off(...args);
  }

  off (...args) {
    this.removeEventListener(...args);
    return this;
  }

  emit (eventName, detail = {}, options = {}) {
    return this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true, composed: true, detail, ...options
    }));
  }

  // ::: attributes

  /**
   * @param {string} name
   * @param {StringConstructor|NumberConstructor|BooleanConstructor|Function} [type=String]
   * @param {*} [fallback]
   */
  attr (name, type = String, fallback) {
    const kebab = toKebabCase(name);

    if (type === Boolean) return this.hasAttribute(kebab);
    if (!this.hasAttribute(kebab)) return fallback;

    const val = this.getAttribute(kebab);

    if (type === Number) {
      const parsed = parseFloat(val);
      return Number.isNaN(parsed) ? fallback : parsed;
    }

    if (typeof type === 'function' && type !== String) {
      try   { return type(val); }
      catch { return fallback; }
    }

    return val;
  }

    /**
   * Unified attribute getter with support for Minimal, Basic, and Full schema definitions.
   * 
   * @param {string|Function} [nameOrType] - Attribute name (string) OR override type constructor.
   * @param {Function} [type] - Optional override type constructor.
   * @param {*} [fallback] - Optional override fallback value.
   */
  getAttr (nameOrType, type, fallback) {
    // Proxy mode: triggered when first arg is not a string (or called as this.getAttr())
    if (typeof nameOrType !== 'string') {
      const overrideType = typeof nameOrType === 'function' ? nameOrType : null;
      return new Proxy(this, {
        get: (target, prop) => (typeof prop === 'string' ? this.getAttr(prop, overrideType, undefined) : undefined)
      });
    }

    // Single attribute mode
    const key = nameOrType;
    const classAttr = this.constructor.attr;
    const schema = (classAttr && typeof classAttr === 'object' && !Array.isArray(classAttr)) ? classAttr : null;

    // Look up schema entry
    const schemaEntry = schema ? (schema[key] ?? schema[toKebabCase(key)]) : undefined;
    const parsedSchema = schemaEntry !== undefined ? parseSchemaEntry(schemaEntry) : null;

    // Resolve final type constructor and fallback
    const finalType = (type && typeof type === 'function')
      ? type
      : (parsedSchema ? parsedSchema.type : String);

    const finalFallback = fallback !== undefined
      ? fallback
      : (parsedSchema ? parsedSchema.fallback : undefined);

    const kebab = toKebabCase(key);

    // 1. Handle Boolean flags
    if (finalType === Boolean) {
      const has = this.hasAttribute(kebab);
      return has ? true : (finalFallback ?? false);
    }

    // 2. Handle missing attributes
    if (!this.hasAttribute(kebab)) {
      return finalFallback;
    }

    let val = this.getAttribute(kebab);

    // 3. Handle Type Casting
    if (finalType === Number) {
      const parsed = parseFloat(val);
      val = Number.isNaN(parsed) ? finalFallback : parsed;
    } else if (typeof finalType === 'function' && finalType !== String) {
      try   { val = finalType(val); }
      catch { val = finalFallback; }
    }

    // 4. Validate against allowed values (Enum check)
    if (parsedSchema?.values && !parsedSchema.values.includes(val)) {
      val = finalFallback;
    }

    // 5. Apply custom transformation function (fn)
    if (parsedSchema?.fn) {
      try   { val = parsedSchema.fn.call(this, val, key); }
      catch { val = finalFallback; }
    }

    return val;
  }

  setAttr (map) {
    for (const [key, value] of Object.entries(map)) {
      const kebab = toKebabCase(key);
           if (value === false || value == null) this.removeAttribute(kebab);
      else if (value === true)                   this.setAttribute(kebab, '');
      else                                        this.setAttribute(kebab, String(value));
    }
    return this;
  }

  // ::: children refs

  /**
   * this.$('selector')       -> querySelector, on/off-decorated
   * this.$.someId            -> getElementById('some-id'), on/off-decorated
   */
  get $ () {
    const root = this.shadowRoot || this;
    const findOne = (selector) => decorateElement(root.querySelector(selector));

    return new Proxy(findOne, {
      apply: (target, thisArg, args) => findOne(...args),
      get (target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        const kebab = toKebabCase(prop);
        return decorateElement(root.getElementById(kebab) || root.getElementById(prop));
      }
    });
  }

  /**
   * this.$$('selector') -> querySelectorAll, elements + array both on/off-decorated
   */
  get $$ () {
    const root = this.shadowRoot || this;
    return (selector) => decorateArray(
      Array.from(root.querySelectorAll(selector)).map(decorateElement)
    );
  }
  
}};
