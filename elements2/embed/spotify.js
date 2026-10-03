import { EmbedComponent, urlOf } from '../base/EmbedComponent.js';

const TYPES = ['album', 'artist', 'episode', 'playlist', 'show', 'track'];

export class EmbedSpotify extends EmbedComponent {

  static attr = {
    type : { type: String, default: 'track', values: TYPES },
  };

  toUrl (src) {
    const url = urlOf(src);
    if (url && !src.startsWith('spotify:')) return url;

    const [, type, id] = src.match(/^spotify:(\w+):(\w+)$/) ?? [null, this.getAttr('type'), src];
    return `https://open.spotify.com/${type}/${encodeURIComponent(id)}`;
  }
}

EmbedSpotify.init('embed-spotify');

export default EmbedSpotify;
