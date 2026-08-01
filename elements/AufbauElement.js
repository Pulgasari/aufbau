// @aufbau/elements/AufbauElement.js
// base class for all aufbau elements (webcomponents)

import { AufbauConfigStore } from './AufbauConfig.js';

// ::::: internal helpers

const toKebabCase = (str) => str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

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
 * Parses a schema entry into a normalized type constructor and fallback value.
 * @param {*} entry - e.g. Number, 50, Boolean, false, String, 'default'
 */
const parseSchemaEntry = (entry) => {
  // Case 1: Direct constructor function (e.g. Number, Boolean, String)
  if (typeof entry === 'function') return { type: entry, fallback: undefined };
  // Case 2: Literal fallback values (infer type constructor from primitive value)
  if (typeof entry === 'number')  return { type: Number, fallback: entry };
  if (typeof entry === 'boolean') return { type: Boolean, fallback: entry };
  if (typeof entry === 'string')  return { type: String, fallback: entry };

  return { type: String, fallback: undefined };
};

// :::::: main class

export class AufbauElement extends HTMLElement {
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
   * Unified attribute getter for single values or Proxy-based destructuring.
   * 
   * Usage single: this.getAttr('name', type, fallback)
   * Usage proxy:  const { foo, bar } = this.getAttr(type)
   * 
   * @param {string|Function} [nameOrType=String] - Attribute name (string) OR type constructor when destructuring.
   * @param {StringConstructor|NumberConstructor|BooleanConstructor|Function} [type=String] - Type constructor (when 1st arg is a string).
   * @param {*} [fallback] - Fallback value (when 1st arg is a string).
   */
  getAttr (nameOrType = String, type = String, fallback) {
    // Proxy mode: triggered when the first argument is not a string (e.g. Boolean, Number, or empty)
    if (typeof nameOrType !== 'string') {
      const targetType = typeof nameOrType === 'function' ? nameOrType : String;
      return new Proxy(this, {
        get: (target, prop) => (typeof prop === 'string' ? this.getAttr(prop, targetType) : undefined)
      });
    }

    // Single attribute mode
    const kebab = toKebabCase(nameOrType);

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
   * Proxy for destructuring multiple attributes at once, e.g.
   * const { checked, disabled } = this.getAttributes(Boolean);
   * @param {StringConstructor|NumberConstructor|BooleanConstructor|Function} [type=String]
   */
  getAttributes (type = String) {
    return new Proxy(this, {
      get: (target, prop) => (typeof prop === 'string' ? this.attr(prop, type) : undefined)
    });
  }

  setAttributes (map) {
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
}

export default AufbauElement;
