// @aufbau/elements/AufbauElement.js
// base class for all aufbau-webcomponents

import { AufbauConfigStore } from './AufbauConfig.js';

export class AufbauElement extends HTMLElement {
  constructor() {
    super();
    this._mounted = false;
  }

  connectedCallback() {
    this._mounted = true;

    // Listen for global config updates
    this._onConfigChange = () => {
      if (this._mounted) this.update();
    };
    window.addEventListener('aufbau-config-changed', this._onConfigChange);

    this.onMount();
    this.update();
  }

  disconnectedCallback () {
    this._mounted = false;

    if (this._onConfigChange) {
      window.removeEventListener('aufbau-config-changed', this._onConfigChange);
    }

    this.onUnmount();
  }

  attributeChangedCallback (name, oldValue, newValue) {
    if (oldValue !== newValue && this._mounted) {
      this.onAttributeChange(name, oldValue, newValue);
      this.update();
    }
  }

  /**
   * Resolves attribute value based on Priority:
   * 1. Direct Element Attribute
   * 2. <aufbau-config> Attribute
   * 3. Fallback Default
   */
  getConfig (attrName, configKey, defaultValue) {
    if (this.hasAttribute(attrName)) {
      return this.getAttribute(attrName);
    }
    
    const globalKey = (configKey || attrName).toLowerCase();
    if (AufbauConfigStore.has(globalKey)) {
      return AufbauConfigStore.get(globalKey);
    }

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
  $  (selector) { return (this.shadowRoot || this).querySelector(selector); }
  $$ (selector) { return Array.from((this.shadowRoot || this).querySelectorAll(selector)); }
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

}

export default AufbauElement;
