// @aufbau/webcomponents/AufbauElement.js
// base class for all aufbau-webcomponents

import aufbau from '@aufbau/kit'; // sollte nicht das kit sein

import { AufbauConfigStore } from './aufbau-config.js';

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

  disconnectedCallback() {
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

  // ::::: Lifecycle Hooks
  onMount() {}
  onUnmount() {}
  onAttributeChange(name, oldValue, newValue) {}
  update() {}

  emit(eventName, detail = {}, options = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true,
      ...options
    }));
  }
}

export default AufbauElement;
