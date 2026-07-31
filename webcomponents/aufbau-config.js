// <aufbau-config>
// Central store for configuration values

export const AufbauConfigStore = new Map;

export class AufbauConfig extends HTMLElement {
  connectedCallback() {
    // Hide the element completely in the DOM
    this.style.display = 'none';
    this.syncConfig();
    this.observeAttributes();
  }

  disconnectedCallback() {
    if (this._observer) this._observer.disconnect();
  }

  observeAttributes() {
    // Observe dynamic changes to <aufbau-config> attributes
    this._observer = new MutationObserver(() => this.syncConfig());
    this._observer.observe(this, { attributes: true });
  }

  syncConfig() {
    // Clear and re-populate config store
    AufbauConfigStore.clear();

    Array.from(this.attributes).forEach(attr => {
      AufbauConfigStore.set(attr.name.toLowerCase(), attr.value);
    });

    // Notify all components on the page about config updates
    window.dispatchEvent(new CustomEvent('aufbau-config-changed', {
      detail: Object.fromEntries(AufbauConfigStore)
    }));
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-config')) {
  customElements.define('aufbau-config', AufbauConfig);
}
