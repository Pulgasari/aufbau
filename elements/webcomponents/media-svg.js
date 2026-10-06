import { AufbauElement } from '@aufbau/element';
import { loadSvg }       from '../lib/svg.js';

// an svg file to look at: inline (scripts and handlers dropped) and fit to the
// width. `checker` puts a checkerboard behind it, for transparent parts
export default class MediaSvg extends AufbauElement {
  static attr = {
    checker : Boolean,
    label   : String,
    src     : String,
  };

  static styles = `media-svg {
    display    : block;
    text-align : center;

    > svg {
      block-size      : auto;
      max-block-size  : var(--media-svg-height, 80vh);
      max-inline-size : 100%;
    }

    &[checker] {
      background : repeating-conic-gradient(color-mix(in oklch, currentColor 12%, transparent) 0 25%, transparent 0 50%) 0 0 / 16px 16px;
    }

    &[failed]::before { content: 'not an svg'; opacity: 0.6; }
  }`;

  async load () {
    const src = this.getAttr('src');
    if (!src || src === this._loaded) return;
    this._loaded = src;

    try {
      const markup = await loadSvg(src);
      if (this._loaded !== src) return;
      this.innerHTML = markup ?? '';
      this.toggleAttribute('failed', !markup);
    }
    catch (error) {
      this.innerHTML = '';
      this.setAttribute('failed', '');
      console.warn(`[media-svg] ${error.message}`);
    }
  }

  sync () {
    const { label } = this.getAttr();
    if (this.internals) {
      this.internals.role      = 'img';
      this.internals.ariaLabel = label || decodeURIComponent(String(this.getAttr('src') ?? '').split('/').pop());
    }
    this.load();
  }
}

MediaSvg.init();
