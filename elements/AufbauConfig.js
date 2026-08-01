// @aufbau/elements/AufbauConfig.js
// <aufbau-config>
// central store for global configuration values, read via AufbauElement#getConfig()

export const AufbauConfigStore = new Map();

export class AufbauConfig extends HTMLElement {
  connectedCallback () {
    this.style.display = 'none'; // never rendered
    this._observer = new MutationObserver(() => this.sync());
    this._observer.observe(this, { attributes: true });
    this.sync();
  }

  disconnectedCallback () {
    this._observer?.disconnect();
  }

  sync () {
    AufbauConfigStore.clear();

    for (const { name, value } of this.attributes) {
      AufbauConfigStore.set(name.toLowerCase(), value);
    }

    window.dispatchEvent(new CustomEvent('aufbau-config-changed', {
      detail: Object.fromEntries(AufbauConfigStore)
    }));
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-config')) {
  customElements.define('aufbau-config', AufbauConfig);
}

export default AufbauConfig;
