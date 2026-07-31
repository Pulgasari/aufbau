// @aufbau/webcomponents
// <aufbau-icon>

import { AufbauElement } from './AufbauElement.js';

export class AufbauIcon extends AufbauElement {
  static get observedAttributes() {
    return ['icon'];
  }

  update() {
    const icon = this.getAttribute('icon');
    if (!icon) return;

    const normalized = icon.replace('/', ':');
    const url = `https://api.iconify.design/${normalized}.svg`;

    this.style.setProperty('--icon-url', `url("${url}")`);
  }
}

customElements.define('aufbau-icon', AufbauIcon);
