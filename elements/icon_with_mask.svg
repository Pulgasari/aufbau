class AufbauIcon extends HTMLElement {
  static get observedAttributes() {
    return ['icon'];
  }

  connectedCallback() {
    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  update() {
    const icon = this.getAttribute('icon');
    if (!icon) return;

    const normalized = icon.replace('/', ':');
    const url = `https://api.iconify.design/${normalized}.svg`;

    // Apply the SVG as a CSS mask
    this.style.setProperty('--icon-url', `url("${url}")`);
  }
}

// Global styles for the web component
const style = document.createElement('style');
style.textContent = `
  aufbau-icon {
    display: inline-block;
    width: 1em;
    height: 1em;
    background-color: currentColor;
    -webkit-mask-image: var(--icon-url);
    mask-image: var(--icon-url);
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    vertical-align: -0.125em;
  }
`;
document.head.appendChild(style);

if (typeof window !== 'undefined' && !customElements.get('aufbau-icon')) {
  customElements.define('aufbau-icon', AufbauIcon);
}
