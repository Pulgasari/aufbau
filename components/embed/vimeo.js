// <embed-vimeo>
// a vimeo video behind a click, by url or by id.
//
//   <embed-vimeo src="https://vimeo.com/76979871"></embed-vimeo>
//   <embed-vimeo src="76979871"></embed-vimeo>

import { EmbedComponent, urlOf } from '../core/EmbedComponent.js';
import { define }                from '../core/names.js';

export class EmbedVimeo extends EmbedComponent {
  toUrl (src) { return urlOf(src) ?? `https://vimeo.com/${encodeURIComponent(src)}`; }
}

define('embed-vimeo', EmbedVimeo);

export default EmbedVimeo;
