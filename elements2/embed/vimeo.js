// <embed-vimeo>
// a vimeo video behind a click, by url or by id.
//
//   <embed-vimeo src="https://vimeo.com/76979871"></embed-vimeo>
//   <embed-vimeo src="76979871"></embed-vimeo>

import { EmbedComponent, urlOf } from '../base/EmbedComponent.js';

export class EmbedVimeo extends EmbedComponent {
  toUrl (src) { return urlOf(src) ?? `https://vimeo.com/${encodeURIComponent(src)}`; }
}

EmbedVimeo.init('embed-vimeo');

export default EmbedVimeo;
