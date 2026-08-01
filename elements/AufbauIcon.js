// <aufbau-icon>

import AufbauElement from './AufbauElement.js';

export class AufbauIcon extends AufbauElement {
  static get observedAttributes () {
    return ['icon'];
  }

  update () {
    const icon = this.attr('icon'); if (!icon) return;
    const url  = `https://api.iconify.design/${icon.replace('/', ':')}.svg`;
    this.style.setProperty('--icon-url', `url("${url}")`);
  }
}

if (!customElements.get('aufbau-icon')) customElements.define('aufbau-icon', AufbauIcon);
export default AufbauIcon;
