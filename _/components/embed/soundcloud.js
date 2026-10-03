// <embed-soundcloud>
// a soundcloud track, set or profile behind a click, by url. soundcloud has no
// public ids to go by.
//
//   <embed-soundcloud src="https://soundcloud.com/artist/track"></embed-soundcloud>

import { EmbedComponent } from '../core/EmbedComponent.js';
import { define }         from '../core/names.js';

export class EmbedSoundcloud extends EmbedComponent {}

define('embed-soundcloud', EmbedSoundcloud);

export default EmbedSoundcloud;
