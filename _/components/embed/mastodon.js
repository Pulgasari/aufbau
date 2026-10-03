// <embed-mastodon>
// a mastodon post behind a click, by url: https://<instance>/@<user>/<id>.
//
//   <embed-mastodon src="https://mastodon.social/@user/112233445566"></embed-mastodon>

import { EmbedComponent } from '../core/EmbedComponent.js';
import { define }         from '../core/names.js';

export class EmbedMastodon extends EmbedComponent {}

define('embed-mastodon', EmbedMastodon);

export default EmbedMastodon;
