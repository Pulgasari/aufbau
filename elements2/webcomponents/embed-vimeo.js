import { Embed, urlOf } from './embed/Embed.js';

export class EmbedVimeo extends Embed {
  toUrl (src) { return urlOf(src) ?? `https://vimeo.com/${encodeURIComponent(src)}`; }
}

EmbedVimeo.init('embed-vimeo');

export default EmbedVimeo;
