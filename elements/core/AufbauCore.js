// @aufbau/elements/core/AufbauCore.js

import { toKebabCase }       from './utils.js';
import { parseSchemaEntry }  from './parseSchemaEntry.js';
import { AufbauConfigStore } from './AufbauConfig.js';

/**
 * Core mixin providing lifecycle, attribute schema, and universal event handling.
 * @param {CustomElementConstructor} BaseClass
 */
export const AufbauCore = (BaseClass = HTMLElement) => {
  return class extends BaseClass {

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
     * @param {string|object} [options] - Optional tag name or config object { name, extends }
     */
    static init (options) {
      const tagName = typeof options === 'string' ? options : options?.name;
      const extendsTag = typeof options === 'object' ? options?.extends : this.extendsTag;

      const name = tagName || toKebabCase(this.name);
      if (!name || !name.includes('-')) {
        console.warn(`[Aufbau] Invalid tag name "${name}". Custom elements require a hyphen.`);
        return;
      }

      if (this.attr && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
        const observed = Array.isArray(this.attr)
          ? this.attr.map(toKebabCase)
          : Object.keys(this.attr).map(toKebabCase);
        Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
      }

      if (!customElements.get(name)) {
        const defineOptions = extendsTag ? { extends: extendsTag } : undefined;
        customElements.define(name, this, defineOptions);
      }
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
     * Self:     this.on('click', handler)
     * Target:   this.on(this._audio, 'timeupdate', handler)
     * Window:   this.on(window, 'resize', handler)
     * Selector: this.on('.btn-play', 'click', handler)
     */
    on (...args) {
      // 1. Standard usage on self: this.on('click', listener, options)
      if (typeof args[0] === 'string' && typeof args[1] === 'function') {
        const [type, listener, options] = args;
        this.addEventListener(type, listener, options);
        return () => this.removeEventListener(type, listener, options);
      }

      // 2. Target/Selector usage: this.on(target, type, listener, options)
      const [rawTarget, type, listener, options] = args;
      if (!rawTarget) return () => {};

      let targets = [];
      if (typeof rawTarget === 'string') {
        const root = this.shadowRoot || this;
        targets = Array.from(root.querySelectorAll(rawTarget));
      } else if (Array.isArray(rawTarget) || rawTarget instanceof NodeList) {
        targets = Array.from(rawTarget);
      } else {
        targets = [rawTarget];
      }

      const unsubs = targets.filter(Boolean).map(target => {
        target.addEventListener(type, listener, options);
        return () => target.removeEventListener(type, listener, options);
      });

      return () => unsubs.forEach(unsub => unsub());
    }

    off (type, listener, options) {
      this.removeEventListener(type, listener, options);
      return this;
    }

    emit (eventName, detail = {}, options = {}) {
      return this.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true, composed: true, detail, ...options
      }));
    }

    // ::: attributes

    /**
     * Unified attribute getter with support for Minimal, Basic, and Full schema definitions.
     * @param {string|Function} [nameOrType]
     * @param {Function} [type]
     * @param {*} [fallback]
     */
    getAttr (nameOrType, type, fallback) {
      if (typeof nameOrType !== 'string') {
        const overrideType = typeof nameOrType === 'function' ? nameOrType : null;
        return new Proxy(this, {
          get: (target, prop) => (typeof prop === 'string' ? this.getAttr(prop, overrideType, undefined) : undefined)
        });
      }

      const key = nameOrType;
      const classAttr = this.constructor.attr;
      const schema = (classAttr && typeof classAttr === 'object' && !Array.isArray(classAttr)) ? classAttr : null;

      const schemaEntry = schema ? (schema[key] ?? schema[toKebabCase(key)]) : undefined;
      const parsedSchema = schemaEntry !== undefined ? parseSchemaEntry(schemaEntry) : null;

      const finalType = (type && typeof type === 'function')
        ? type
        : (parsedSchema ? parsedSchema.type : String);

      const finalFallback = fallback !== undefined
        ? fallback
        : (parsedSchema ? parsedSchema.fallback : undefined);

      const kebab = toKebabCase(key);

      if (finalType === Boolean) {
        const has = this.hasAttribute(kebab);
        return has ? true : (finalFallback ?? false);
      }

      if (!this.hasAttribute(kebab)) {
        return finalFallback;
      }

      let val = this.getAttribute(kebab);

      if (finalType === Number) {
        const parsed = parseFloat(val);
        val = Number.isNaN(parsed) ? finalFallback : parsed;
      } else if (typeof finalType === 'function' && finalType !== String) {
        try   { val = finalType(val); }
        catch { val = finalFallback; }
      }

      if (parsedSchema?.values && !parsedSchema.values.includes(val)) {
        val = finalFallback;
      }

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
     * Query single element: this.$('selector') or ID lookup: this.$.myId
     */
    get $ () {
      const root = this.shadowRoot || this;
      const findOne = (selector) => root.querySelector(selector);

      return new Proxy(findOne, {
        apply: (target, thisArg, args) => findOne(...args),
        get (target, prop) {
          if (prop in target) return target[prop];
          if (typeof prop !== 'string') return undefined;
          const kebab = toKebabCase(prop);
          return root.getElementById(kebab) || root.getElementById(prop);
        }
      });
    }

    /**
     * Query all matching elements as a clean Array: this.$$('selector')
     */
    get $$ () {
      const root = this.shadowRoot || this;
      return (selector) => Array.from(root.querySelectorAll(selector));
    }
  };
};

export default AufbauCore;
