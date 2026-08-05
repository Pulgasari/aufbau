// @aufbau/elements/core/AufbauCore.js

import { decorate, decorateAll } from './utils.js';
import { parseSchemaEntry }      from './parseSchemaEntry.js';
import { AufbauConfigStore }     from './AufbauConfig.js';

import { emitEvent, offEvent, onEvent } from './../utils/events.js';
import { toKebabCase }                  from './../utils/strings.js';

const isFn     = sth => typeof sth === 'function';
const isString = sth => typeof sth === 'string';

export const AufbauCore = (BaseClass = HTMLElement) => {
  return class extends BaseClass {

    constructor () {
      super();
      this._mounted = false;
      this._unsubs  = [];
    }

    // ::: lifecycle

    connectedCallback () {
      this._mounted = true;
      // tracked, so it is released in disconnectedCallback like any other listener
      this.on(window, 'aufbau-config-changed', () => { if (this._mounted) this.update(); });
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
      const tagName    = isString(options) ? options : options?.name;
      const extendsTag = typeof options === 'object' ? options?.extends : this.extendsTag;

      const name = tagName || toKebabCase(this.name);
      if (!name || !name.includes('-')) {
        console.warn(`[Aufbau] Invalid tag name "${name}". Custom elements require a hyphen.`);
        return;
      }

      if (this.attr && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
        const observed = Array.isArray(this.attr) ? this.attr.map(toKebabCase) : Object.keys(this.attr).map(toKebabCase);
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

    track (unsub) {
      this._unsubs.push(unsub);
      return unsub;
    }

    release () {
      this._unsubs.forEach(unsub => unsub());
      this._unsubs = [];
      return this;
    }

    on (...args) {
      // 1. self: this.on(type, listener, options)
      if (typeof args[0] === 'string' && isFn(args[1])) {
        return this.track(on(this, ...args));
      }

      // 2. target or selector: this.on(rawTarget, type, listener, options)
      const [rawTarget, type, listener, options] = args;
      if (!rawTarget) return () => {};

      const root = this.shadowRoot || this;
      const targets =
        isString(rawTarget)                              ? Array.from(root.querySelectorAll(rawTarget))
        : Array.isArray(rawTarget) || rawTarget instanceof NodeList ? Array.from(rawTarget)
        : [rawTarget];

      const unsubs = targets.filter(Boolean).map(target => onEvent(target, type, listener, options));
      return this.track(() => unsubs.forEach(unsub => unsub()));
    }

    off (...args) {
      off(this, ...args);
      return this;
    }
    
    emit (...args) {
      return emitEvent (this, ...args);
    }



    // ::: attributes

    getAttr (nameOrType, type, fallback) {
      if (typeof nameOrType !== 'string') {
        const overrideType = isFn(nameOrType) ? nameOrType : null;
        return new Proxy(this, {
          get: (target, prop) => (typeof prop === 'string' ? this.getAttr(prop, overrideType, undefined) : undefined)
        });
      }

      const key          = nameOrType;
      const classAttr    = this.constructor.attr;
      const schema       = (classAttr && typeof classAttr === 'object' && !Array.isArray(classAttr)) ? classAttr : null;
      const schemaEntry  = schema ? (schema[key] ?? schema[toKebabCase(key)]) : undefined;
      const parsedSchema = schemaEntry !== undefined ? parseSchemaEntry(schemaEntry) : null;

      const finalType = (type && isFn(type))
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
      } else if (isFn(finalType) && finalType !== String) {
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


    
    get $ () {
      const root = this.shadowRoot || this;
      const findOne = (selector) => decorate(root.querySelector(selector));

      return new Proxy(findOne, {
        apply: (target, thisArg, args) => findOne(...args),
        get (target, prop) {
          if (prop in target) return target[prop];
          if (typeof prop !== 'string') return undefined;
          const kebab = toKebabCase(prop);
          return decorate(root.getElementById(kebab) || root.getElementById(prop));
        }
      });
    }

    get $$ () {
      const root = this.shadowRoot || this;
      return (selector) => decorateAll(Array.from(root.querySelectorAll(selector)));
    }
  };
};

export default AufbauCore;
