import { EmbedComponent, urlOf } from '../base/EmbedComponent.js';

export class EmbedVimeo extends EmbedComponent {
  toUrl (src) { return urlOf(src) ?? `https://vimeo.com/${encodeURIComponent(src)}`; }
}

EmbedVimeo.init('embed-vimeo');

export default EmbedVimeo;
