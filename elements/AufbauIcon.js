// <aufbau-icon>

import AufbauElement from './AufbauElement.js';

export default class AufbauIcon extends AufbauElement {
  static attr = {
    icon : String,
  };

  update () {
    const icon = this.getAttr('icon'); if (!icon) return;
    const url  = `https://api.iconify.design/${icon.replace('/', ':')}.svg`;
    this.style.setProperty('--icon-url', `url("${url}")`);
  }
}

AufbauIcon.init();
