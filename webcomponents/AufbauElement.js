// @aufbau/webcomponents/AufbauElement.js
// base class for all aufbau-webcomponents

import aufbau from '@aufbau/kit'; // sollte nicht das kit sein

export class AufbauElement extends HTMLElement {
  constructor() {
    super();
    this._mounted = false;
  }

  connectedCallback() {
    this._mounted = true;
    this.onMount();
    this.update();
  }

  disconnectedCallback() {
    this._mounted = false;
    this.onUnmount();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this._mounted) {
      this.onAttributeChange(name, oldValue, newValue);
      this.update();
    }
  }

  // ::::: Lifecycle Hooks (in Subklassen überschreibbar)
  onMount   () {}
  onUnmount () {}
  onAttributeChange(name, oldValue, newValue) {}
  
  /**
   * Wird bei Initialisierung und Attributänderungen aufgerufen.
   * Hier bauen Subklassen ihr HTML auf oder aktualisieren Styles.
   */
  update() {}

  // ::::: Event Emitter Helper
  emit(eventName, detail = {}, options = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true, // Durchbricht Shadow-DOM-Grenzen, falls später benötigt
      ...options
    }));
  }

  // ::::: Theming Helper
  get currentTheme() {
    // Kann später auf aufbau.theme.value hören oder CSS-Variablen auslesen
    return this.getAttribute('theme') || document.documentElement.dataset.theme || 'default';
  }
}
