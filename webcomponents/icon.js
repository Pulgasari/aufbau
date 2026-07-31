// In-memory cache for loaded SVGs
const iconCache = new Map();

class AufbauIcon extends HTMLElement {
  static get observedAttributes() {
    return ['icon'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1em;
          height: 1em;
          line-height: 1;
          vertical-align: -0.125em; /* Aligns smoothly with text baseline */
        }
        svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      </style>
      <span id="slot"></span>
    `;
  }

  connectedCallback() {
    this.loadIcon();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.loadIcon();
    }
  }

  async loadIcon() {
    const icon = this.getAttribute('icon');
    const slot = this.shadowRoot.getElementById('slot');

    if (!icon) {
      slot.innerHTML = '';
      return;
    }

    // Replace slash with colon if someone writes "bx/search" instead of "bx:search"
    const normalizedIcon = icon.replace('/', ':');

    try {
      let svgText = iconCache.get(normalizedIcon);

      if (!svgText) {
        // Fetch raw SVG directly from Iconify CDN
        const response = await fetch(`https://api.iconify.design/${normalizedIcon}.svg`);
        if (!response.ok) throw new Error(`Icon HTTP ${response.status}`);
        
        svgText = await response.text();
        iconCache.set(normalizedIcon, svgText);
      }

      slot.innerHTML = svgText;
    } catch (err) {
      console.warn(`[aufbau-icon] Could not load icon "${icon}":`, err);
      slot.innerHTML = '';
    }
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-icon')) {
  customElements.define('aufbau-icon', AufbauIcon);
}
