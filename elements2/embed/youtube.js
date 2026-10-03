// <embed-youtube>
// a youtube video behind a click, by url or by id. `start` in seconds or as
// '1m30s', a url's own t= wins.
//
//   <embed-youtube src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></embed-youtube>
//   <embed-youtube src="dQw4w9WgXcQ" start="1m30s"></embed-youtube>

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
