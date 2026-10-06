import { AufbauElement } from '@aufbau/element';
import { localUrl }      from './svg-icon.js';

const LOGOS = '@aufbau/svg/logos/';

// a logo of @aufbau/svg/logos, monochrome in currentColor like <svg-icon>. the
// file is a mask, a hidden <img> of it gives the width that fits the height
export default class SvgLogo extends AufbauElement {
  static attr = {
    color : String,
    label : String,
    logo  : String,
    size  : String,
  };

  static styles = `svg-logo {
    background-color : var(--logo-color, currentColor);
    display          : inline-block;
    flex             : none;
    line-height      : 0;
    mask             : var(--logo-url, linear-gradient(transparent, transparent)) center / contain no-repeat;
    vertical-align   : var(--logo-align, middle);

    img {
      /*
      block-size  : var(--logo-size, 1.5em);
      inline-size : auto;
      */
      visibility  : hidden;
    }

    &:not([logo]) { display: none; }
  }`;

  render () {
    return '<img alt="" draggable="false">';
  }

  sync () {
    const { color, label, logo, size } = this.getAttr();
    const img = this.querySelector('img');
    const url = logo ? localUrl(LOGOS, logo) : null;

    this.setVar({ '--logo-color': color, '--logo-size': size, '--logo-url': url && `url("${url}")` });

    if (this.internals) {
      this.internals.role       = label ? 'img' : null;
      this.internals.ariaLabel  = label || null;
      this.internals.ariaHidden = label ? null : 'true';
    }

    if (!img) return;
    if (url) img.src = url;
    else     img.removeAttribute('src');
  }
}

SvgLogo.init();
