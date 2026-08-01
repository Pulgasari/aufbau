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

/*

class AufbauIcon extends HTMLElement {
  static att r= {
    icon : String,
  };
  
  connectedCallback() {
    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  update() {
    const { icon }   = this.getAttr(); if (!icon) return;
    const normalized = icon.replace('/', ':');
    const url        = `https://api.iconify.design/${normalized}.svg`;

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

AufbauIcon.init();

*/
