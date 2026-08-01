// @aufbau/elements/AufbauElement.js
// base class for all aufbau-webcomponents

import { AufbauConfigStore } from './AufbauConfig.js';

// ::::: internal helpers

const decorateElement = (el) => {
  if (!el || el._aufbauDecorated) return el;

  Object.defineProperties(el, {
    _aufbauDecorated: { value: true, configurable: true },
    on: {
      value: function (...args) {
        this.addEventListener(...args);
        return () => this.removeEventListener(...args);
      },
      writable: true,
      configurable: true
    },
    off: {
      value: function (...args) {
        this.removeEventListener(...args);
        return this;
      },
      writable: true,
      configurable: true
    }
  });

  return el;
};

const decorateArray = (arr) => {
  Object.defineProperties(arr, {
    on: {
      value: function (...args) {
        const unsubs = this.map(el => el.on?.(...args) || (() => {}));
        return () => unsubs.forEach(unsub => unsub());
      },
      writable: true,
      configurable: true
    },
    off: {
      value: function (...args) {
        this.forEach(el => el.off?.(...args));
        return this;
      },
      writable: true,
      configurable: true
    }
  });

  return arr;
};

// :::::: main class

export class AufbauElement extends HTMLElement {
  constructor () {
    super();
    this._mounted = false;
  }

  connectedCallback () {
    this._mounted = true;
    this._onConfigChange = () => { if (this._mounted) this.update(); };
    window.addEventListener('aufbau-config-changed', this._onConfigChange);
    this.onMount(); this.update();
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

  getConfig (attrName, configKey, defaultValue) {
    if (this.hasAttribute(attrName)) return this.getAttribute(attrName);
    
    const globalKey = (configKey || attrName).toLowerCase();
    if (AufbauConfigStore.has(globalKey)) return AufbauConfigStore.get(globalKey);

    return defaultValue;
  }

  // ::: lifecycle hooks
  onAttributeChange (name, oldValue, newValue) {}
  onMount   () {}
  onUnmount () {}
  update    () {}
  emit (eventName, detail = {}, options = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true, composed: true, detail, ...options
    }));
  }

  // ::: shorthands

  setAttributes (map) {
    for (const [key, value] of Object.entries(map)) {
      const kebab = key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
           if (value === false || value == null ) this.removeAttribute(kebab);
      else if (value === true) this.setAttribute(kebab, '');
      else                     this.setAttribute(kebab, String(value));
    }
  }
  getAttributes (type = String) { return new Proxy(this, { get (target, prop) {
    if (typeof prop !== 'string') return undefined;
    const kebab = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    if (type === Boolean) return target.hasAttribute(kebab);
    if (!target.hasAttribute(kebab)) return undefined;
    const val = target.getAttribute(kebab);

    if (type === Number) {
      const parsed = parseFloat(val);
      return Number.isNaN(parsed) ? undefined : parsed;
    }

    if (typeof type === 'function' && type !== String) {
      try   { return type(val); } 
      catch { return undefined; }
    }

    return val;
  }});}
  get getAttributes () { return new Proxy (this, {get (target, prop) {
    if (typeof prop !== 'string') return undefined;
    const kebab = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
    return target.hasAttribute(kebab) ? target.getAttribute(kebab) : undefined;     
  }});}
  
  attr (name, fallback = '') {
    return this.getAttribute(name) ?? fallback;
  }
  boolAttr (name) {
    return this.hasAttribute(name);
  }
  numAttr(name, fallback = 0) {
    const val = parseFloat(this.getAttribute(name));
    return Number.isNaN(val) ? fallback : val;
  }
  
  on (...args) { 
    this.addEventListener(...args); 
    return () => this.off(...args);
  }
  off (...args) {
    this.removeEventListener(...args);
    return this;
  }

  //

  get $() {
    const root = this.shadowRoot || this;

    const findOne = (target) => {
      if (typeof target !== 'string') return target ? decorateElement(target) : null;

      const kebab = target.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      const el = root.querySelector(target)
              || root.getElementById(kebab)
              || root.getElementById(target)
              || root.querySelector(`.${kebab}`)
              || root.querySelector(`[data-ref="${target}"]`);

      return decorateElement(el);
    };

    const queryFn = (selector) => findOne(selector);
    queryFn.on  = (target, ...args) => findOne(target)?. on(...args) || (() => {});
    queryFn.off = (target, ...args) => findOne(target)?.off(...args);

    return new Proxy (queryFn, {
      apply.(target, thisArg, argArray) {
        return queryFn(...argArray);
      },
      get (target, prop) {
        return (prop in target)           ? target[prop]
             : (typeof prop !== 'string') ? undefined;
             : findOne(prop);
      }
    });
  }
  
  get $$ () {
    const root = this.shadowRoot || this;
    const _fn = (selector) => {
      const nodes = Array.from(root.querySelectorAll(selector));
      nodes.forEach(decorateElement);
      return decorateArray(nodes);
    };
    _fn.on  = (selector, ...args) => _fn(selector). on(...args);
    _fn.off = (selector, ...args) => _fn(selector).off(...args);
    return _fn;
  }

}

export default AufbauElement;
