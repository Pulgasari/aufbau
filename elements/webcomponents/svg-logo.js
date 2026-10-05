import { AufbauElement } from '@aufbau/element';
import { localUrl }      from './svg-icon.js';

const LOGOS = '@aufbau/svg/logos/';

// a logo of @aufbau/svg/logos in its own colours. an <img>, so the width follows
// the aspect ratio of the file and only the height is set
export default class SvgLogo extends AufbauElement {
  static attr = {
    label : String,
    logo  : String,
    size  : String,
  };

  static styles = `svg-logo {
    display        : inline-block;
    flex           : none;
    line-height    : 0;
    vertical-align : var(--logo-align, middle);

    img {
      block-size  : var(--logo-size, 1.5em);
      inline-size : auto;
    }

    &:not([logo]) { display: none; }
  }`;

  render () {
    return '<img alt="" draggable="false">';
  }

  sync () {
    const { label, logo, size } = this.getAttr();
    const img = this.querySelector('img');
    const url = logo ? localUrl(LOGOS, logo) : null;

    this.setVar({ '--logo-size': size });

    if (!img) return;
    if (url) img.src = url;
    else     img.removeAttribute('src');

    img.alt = label ?? '';
  }
}

SvgLogo.init();
