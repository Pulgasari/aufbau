import { Embed, urlOf } from './Embed.js';

export class EmbedVimeo extends Embed {
  toUrl (src) { return urlOf(src) ?? `https://vimeo.com/${encodeURIComponent(src)}`; }
}

EmbedVimeo.init('embed-vimeo');

export default EmbedVimeo;
