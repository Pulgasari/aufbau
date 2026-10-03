// <aufbau-video>
// a native <video>, or a youtube embed when `youtube-id` is set. the player is
// the only child. playback flags are applied as properties, so toggling muted
// or loop does not rebuild the player and reset playback.

import { AufbauElement } from './core/index.js';
import { html }          from './core/html.js';

const YOUTUBE = 'https://www.youtube-nocookie.com/embed/';
const ALLOW   = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

export default class AufbauVideo extends AufbauElement {
  static attr = {
    autoplay  : Boolean,
    controls  : true,
    label     : 'Video player',
    loop      : Boolean,
    muted     : Boolean,
    poster    : String,
    src       : String,
    youtubeId : String,
  };

  static styles = `aufbau-video {
    display: block;

    > video { display: block; inline-size: 100%; }

    > iframe {
      aspect-ratio : 16 / 9;
      border       : 0;
      display      : block;
      inline-size  : 100%;
    }
  }`;

  get player () { return this.$(':scope > video'); }

  render () {
    const { label, src, youtubeId } = this.getAttr();

    if (youtubeId) return html`
      <iframe src="${YOUTUBE}${encodeURIComponent(youtubeId)}?rel=0" title="${label}" allow="${ALLOW}" allowfullscreen></iframe>
    `;

    return src ? html`<video src="${src}"></video>` : '';
  }

  sync () {
    const video = this.player;
    if (!video) return;

    const { autoplay, controls, loop, muted, poster } = this.getAttr();

    Object.assign(video, { autoplay, controls, loop, muted });
    if (poster) video.poster = poster;
    else video.removeAttribute('poster');
  }
}

AufbauVideo.init();
