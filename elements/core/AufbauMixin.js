// @aufbau/elements/core/AufbauMixin.js

import { toKebabCase }       from './utils.js';
import { parseSchemaEntry }  from './parseSchemaEntry.js';
import { AufbauConfigStore } from './AufbauConfig.js';

// Internal decorator helpers...
const decorateElement = (el) => { /* ... */ return el; };
const decorateArray   = (arr) => { /* ... */ return arr; };

/**
 * Mixin that injects all Aufbau framework powers into any HTML base class.
 */
export const AufbauMixin = (BaseClass = HTMLElement) => {
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
     * Auto-registers the custom element and handles customized built-in elements.
     * @param {string|object} [options] - Tag name or config object { name, extends }
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
        const observed = Array.isArray(this.attr) ? this.attr.map(toKebabCase) : Object.keys(this.attr).map(toKebabCase);
        Object.defineProperty(this, 'observedAttributes', { configurable: true, get: () => observed });
      }

      if (!customElements.get(name)) {
        const defineOptions = extendsTag ? { extends: extendsTag } : undefined;
        customElements.define(name, this, defineOptions);
      }
    }

    // ::: lifecycle hooks
    onAttributeChange (name, oldValue, newValue) {}
    onMount   () {}
    onUnmount () {}
    update    () {}

    // ::: events & attributes (all existing methods getAttr, emit, $, $$ stay 100% same)
    // ...
  };
};
