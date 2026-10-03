import { EmbedComponent, urlOf } from '../base/EmbedComponent.js';

export class EmbedYoutube extends EmbedComponent {

  static attr = {
    start : String,
  };

  toUrl (src) {
    const url = new URL(urlOf(src) ?? `https://www.youtube.com/watch?v=${encodeURIComponent(src)}`);
    const start = this.getAttr('start');
    if (start && !url.searchParams.has('t')) url.searchParams.set('t', start);
    return url.href;
  }
}

EmbedYoutube.init('embed-youtube');

export default EmbedYoutube;
