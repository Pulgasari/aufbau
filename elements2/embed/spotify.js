// <embed-spotify>
// spotify behind a click, by url, by uri or by id with its type.
//
//   <embed-spotify src="https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3"></embed-spotify>
//   <embed-spotify src="spotify:track:4uLU6hMCjMI75M1A2tKUQC"></embed-spotify>
//   <embed-spotify src="37i9dQZF1DXcBWIGoYBM5M" type="playlist"></embed-spotify>

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
