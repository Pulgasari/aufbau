import { AufbauElement } from '@aufbau/element';

const API = 'https://picsum.photos';

let count = 0;

// a placeholder photo from picsum.photos. the same seed gives the same photo,
// without one every element gets another
export default class MockImg extends AufbauElement {
  static attr = {
    alt       : String,
    blurred   : 0,
    grayscale : Boolean,
    height    : 300,
    seed      : String,
    width     : 400,
  };

  static styles = `mock-img {
    background  : color-mix(in oklch, currentColor 10%, transparent);
    display     : inline-block;
    line-height : 0;

    img {
      block-size      : auto;
      max-inline-size : 100%;
    }
  }`;

  constructor () {
    super();
    this.index = ++count;
  }

  url () {
    const { blurred, grayscale, height, seed, width } = this.getAttr();
    const query = [];

    if (grayscale) query.push('grayscale');
    if (blurred)   query.push(`blur=${Math.min(10, Math.max(1, Math.round(blurred)))}`);
    if (!seed)     query.push(`random=${this.index}`);

    const path = seed ? `/seed/${encodeURIComponent(seed)}` : '';
    return `${API}${path}/${width}/${height}${query.length ? `?${query.join('&')}` : ''}`;
  }

  render () {
    const { alt, height, width } = this.getAttr();
    const img = document.createElement('img');

    img.alt      = alt ?? '';
    img.decoding = 'async';
    img.height   = height;
    img.loading  = 'lazy';
    img.src      = this.url();
    img.width    = width;

    return img.outerHTML;
  }
}

MockImg.init();
