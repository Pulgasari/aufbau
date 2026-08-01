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

  // ::: shorthands
  on (...args) { 
    this.addEventListener(...args); 
    return () => this.off(...args);
  }
  off (...args) {
    this.removeEventListener(...args);
    return this;
  }


  emit (eventName, detail = {}, options = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true, composed: true, detail, ...options
    }));
  }
}

export default AufbauElement;
