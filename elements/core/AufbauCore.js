// @aufbau/elements/core/AufbauCore.js

import { decorate, decorateAll } from './utils.js';
import { parseSchemaEntry }      from './parseSchemaEntry.js';
import { CONFIG_EVENT, configKeys, resolveConfig } from './AufbauConfig.js';

import {
  coerce, createLogger, disposer,
  emitEvent, offEvent, onEvent,
  isFn, isPlainObject, isString,
  toBoolean, toKebabCase,
} from '@aufbau/utils';

const log = createLogger('aufbau-core');

export const AufbauCore = (BaseClass = HTMLElement) => {
return class extends BaseClass {

    constructor () {
      super();
      this._mounted = false;
      this._effects = disposer();
    }

    // ::: lifecycle

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

    static init (options) {
      const tagName    = isString(options) ? options : options?.name;
      const extendsTag = isPlainObject(options) ? options.extends : this.extendsTag;

      const name = tagName || toKebabCase(this.name);
      if (!name || !name.includes('-')) {
        return log.warn(`invalid tag name "${name}", custom elements require a hyphen.`);
      }

      if (this.attr && !Object.getOwnPropertyDescriptor(this, 'observedAttributes')) {
        const observed = (Array.isArray(this.attr) ? this.attr : Object.keys(this.attr)).map(toKebabCase);
        Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
      }

      if (customElements.get(name)) return;
      customElements.define(name, this, extendsTag ? { extends: extendsTag } : undefined);
    }

    // ::: lifecycle hooks (override in subclasses)

    onAttributeChange (name, oldValue, newValue) {}
    onMount   () {}
    onUnmount () {}
    update    () {}

    // ::: config

    /** works for customized built-ins too: <datalist is="aufbau-datalist"> -> 'aufbau-datalist' */
    get tag () {
      return this.getAttribute('is') || this.localName;
    }

    /** static attr as a schema map, null when declared as a plain array */
    get schema () {
      const { attr } = this.constructor;
      return isPlainObject(attr) ? attr : null;
    }

    /** config keys this element depends on. null means: react to any change */
    get configWatchlist () {
      if (this._configWatchlist !== undefined) return this._configWatchlist;

      const explicit = this.constructor.observedConfig;
      if (Array.isArray(explicit)) return (this._configWatchlist = new Set(explicit.map(toKebabCase)));

      const schema = this.schema;
      if (!schema) return (this._configWatchlist = null);

      const keys = new Set();
      for (const [name, entry] of Object.entries(schema)) {
        const { config } = parseSchemaEntry(entry);
        if (!config) continue;
        if (config === true) configKeys(this.tag, name).forEach(key => keys.add(key));
        else config.forEach(key => keys.add(toKebabCase(key)));
      }

      return (this._configWatchlist = keys.size ? keys : null);
    }

    observesConfig (changed) {
      const watchlist = this.configWatchlist;
      if (!watchlist || !Array.isArray(changed)) return true;
      return changed.some(key => watchlist.has(key));
    }

    /**
     * precedence: local attribute -> <aufbau-config> -> fallback
     * @param {string} name
     * @param {*} [fallback]
     * @param {true|string|string[]} [keys=true] - config key(s), true auto namespaces
     */
    getConfig (name, fallback, keys = true) {
      const kebab = toKebabCase(name);
      if (this.hasAttribute(kebab)) return this.getAttribute(kebab);

      const found = resolveConfig(this.tag, kebab, keys);
      return found === undefined ? fallback : found;
    }

    // ::: events

    track (unsubscribe) {
      return this._effects.add(unsubscribe);
    }

    release () {
      this._effects.dispose();
      return this;
    }

    /**
     * this.on(type, listener, options)                  -> self
     * this.on(target|selector|list, type, listener, ...) -> children or any target
     */
    on (...args) {
      if (isString(args[0]) && isFn(args[1])) return this.track(onEvent(this, ...args));

      const [rawTarget, type, listener, options] = args;
      if (!rawTarget) return () => {};

      const targets = isString(rawTarget) ? this.$$(rawTarget) : rawTarget;
      return this.track(onEvent(targets, type, listener, options));
    }

    off (...args) {
      offEvent(this, ...args);
      return this;
    }

    emit (type, detail, options) {
      return emitEvent(this, type, detail, options);
    }

    // ::: attributes

    getAttr (nameOrType, type, fallback) {
      if (!isString(nameOrType)) {
        const overrideType = isFn(nameOrType) ? nameOrType : null;
        return new Proxy(this, {
          get: (target, prop) => (isString(prop) ? this.getAttr(prop, overrideType, undefined) : undefined)
        });
      }

      const kebab  = toKebabCase(nameOrType);
      const schema = this.schema;
      const entry  = schema ? (schema[nameOrType] ?? schema[kebab]) : undefined;
      const parsed = entry !== undefined ? parseSchemaEntry(entry) : null;

      const finalType     = isFn(type) ? type : (parsed?.type ?? String);
      const finalFallback = fallback !== undefined ? fallback : parsed?.fallback;
      const fromConfig    = () => (parsed?.config ? resolveConfig(this.tag, kebab, parsed.config) : undefined);

      // booleans: attribute presence first, then config, then fallback
      if (finalType === Boolean) {
        if (this.hasAttribute(kebab)) return true;
        const configured = fromConfig();
        return configured === undefined ? (finalFallback ?? false) : toBoolean(configured);
      }

      // attribute -> config -> fallback
      const raw = this.hasAttribute(kebab) ? this.getAttribute(kebab) : fromConfig();
      if (raw == null) return finalFallback;

      let value = coerce(raw, finalType, finalFallback);

      if (parsed?.values && !parsed.values.includes(value)) value = finalFallback;

      if (parsed?.fn) {
        try   { value = parsed.fn.call(this, value, nameOrType); }
        catch { value = finalFallback; }
      }

      return value;
    }

    setAttr (map) {
      for (const [key, value] of Object.entries(map)) {
        const kebab = toKebabCase(key);
             if (value === false || value == null) this.removeAttribute(kebab);
        else if (value === true)                   this.setAttribute(kebab, '');
        else                                       this.setAttribute(kebab, String(value));
      }
      return this;
    }

    // ::: children refs

    get $ () {
      const root    = this.shadowRoot || this;
      const findOne = (selector) => decorate(root.querySelector(selector));

      return new Proxy(findOne, {
        apply: (target, thisArg, args) => findOne(...args),
        get (target, prop) {
          if (prop in target) return target[prop];
          if (!isString(prop)) return undefined;
          const kebab = toKebabCase(prop);
          return decorate(root.getElementById(kebab) || root.getElementById(prop));
        }
      });
    }

    get $$ () {
      const root = this.shadowRoot || this;
      return (selector) => decorateAll(Array.from(root.querySelectorAll(selector)));
    }

};};

export default AufbauCore;
