import { AufbauElement } from '@aufbau/element';
import { loadSvg }       from '../lib/svg.js';

// an svg file inline, so css reaches into it: currentColor, var(), :hover on
// its parts. scripts and event handlers of the file are dropped
export default class SvgFile extends AufbauElement {
  static attr = {
    label : String,
    size  : String,
    src   : String,
  };

  static styles = `svg-file {
    display        : inline-block;
    flex           : none;
    line-height    : 0;
    vertical-align : var(--svg-align, middle);

    > svg {
      block-size      : var(--svg-size, auto);
      inline-size     : auto;
      max-inline-size : 100%;
    }

    &:not([src]) { display: none; }
  }`;

  async load () {
    const src = this.getAttr('src');
    if (!src || src === this._loaded) return;
    this._loaded = src;

    try {
      const markup = await loadSvg(src);
      if (this._loaded !== src) return;   // another src came meanwhile
      this.innerHTML = markup ?? '';
      this.removeAttribute('failed');
      this.emit('svg-file', { src });
    }
    catch (error) {
      this.innerHTML = '';
      this.setAttribute('failed', '');
      console.warn(`[svg-file] ${error.message}`);
    }
  }

  sync () {
    const { label, size } = this.getAttr();
    this.setVar({ '--svg-size': size });

    if (this.internals) {
      this.internals.role       = label ? 'img' : null;
      this.internals.ariaLabel  = label || null;
      this.internals.ariaHidden = label ? null : 'true';
    }

    this.load();
  }
}

SvgFile.init();
