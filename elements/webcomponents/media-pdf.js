import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// a pdf in the browser's own viewer, at `page`. many mobile browsers have none
// inline, so a link to open it stays below
export default class MediaPdf extends AufbauElement {
  static attr = {
    label : String,
    page  : Number,
    src   : String,
  };

  static styles = `media-pdf {
    display: block;

    > iframe {
      aspect-ratio : var(--pdf-ratio, 1 / 1.414);
      border       : 0;
      display      : block;
      inline-size  : 100%;
    }

    > a { display: inline-block; font-size: 0.85em; margin-block-start: --space(tiny); }
  }`;

  render () {
    const { label, page, src } = this.getAttr();
    if (!src) return '';
    const name = label ?? decodeURIComponent(src.split(/[?#]/)[0].split('/').pop());
    const url  = page ? `${src.split('#')[0]}#page=${page}` : src;

    return html`
      <iframe ${attrs({ src: url, title: name })}></iframe>
      <a ${attrs({ href: url, rel: 'noopener', target: '_blank' })}>${name}</a>
    `;
  }
}

MediaPdf.init();
