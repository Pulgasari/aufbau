// <embed-mastodon>
// a mastodon post behind a click, by url: https://<instance>/@<user>/<id>.
//
//   <embed-mastodon src="https://mastodon.social/@user/112233445566"></embed-mastodon>

import { EmbedComponent } from '../base/EmbedComponent.js';

export class EmbedMastodon extends EmbedComponent {}

EmbedMastodon.init('embed-mastodon');

export default EmbedMastodon;
