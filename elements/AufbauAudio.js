// <aufbau-audio>
// a small player. the host is the card, its children are laid out by grid
// areas: cover, title, artist, play button, current time, seek bar, duration.
// the markup is only rebuilt when the metadata changes, playback state and
// progress are applied to the existing nodes.

import { AufbauElement } from './core/index.js';
import { attrs, html }   from './core/html.js';
import { toggleState }   from './core/utils.js';

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

export default class AufbauAudio extends AufbauElement {
  static attr = {
    artist   : String,
    autoplay : Boolean,
    cover    : String,
    // renamed from title, which put a native tooltip over the whole player
    label    : 'Unknown Title',
    layout   : { type: String, default: 'card', values: ['card', 'minimal'] },
    loop     : Boolean,
    src      : String,
  };

  static styles = `aufbau-audio {
    align-items           : center;
    column-gap            : 0.75em;
    display               : grid;
    grid-template-areas   : "cover title   title   title title"
                            "cover artist  artist  artist artist"
                            "cover play    current seek  duration";
    grid-template-columns : auto auto auto 1fr auto;

    &:not(:has(> img)) {
      grid-template-areas   : "title   title   title title"
                              "artist  artist  artist artist"
                              "play    current seek  duration";
      grid-template-columns : auto auto 1fr auto;
    }

    &[layout="minimal"] {
      grid-template-areas   : "play title" "play artist";
      grid-template-columns : auto 1fr;
    }

    > img {
      block-size  : var(--audio-cover-size, 4em);
      grid-area   : cover;
      inline-size : var(--audio-cover-size, 4em);
      object-fit  : cover;
    }

    > strong { grid-area: title; }
    > span   { grid-area: artist; opacity: 0.7; }

    > button {
      align-items : center;
      background  : none;
      border      : 0;
      color       : inherit;
      cursor      : pointer;
      display     : inline-flex;
      font        : inherit;
      grid-area   : play;
      margin      : 0;
      padding     : 0;
    }

    > input { grid-area: seek; inline-size: 100%; margin: 0; }

    > time {
      font-size            : 0.8em;
      font-variant-numeric : tabular-nums;
    }

    > time:first-of-type { grid-area: current; }
    > time:last-of-type  { grid-area: duration; }
  }`;

  constructor () {
    super();
    this._internals = this.attachInternals?.() ?? null;
    this._audio     = new Audio;
  }

  get playing () { return !this._audio.paused; }

  onMount () {
    const audio = this._audio;

    this.on(audio, ['loadedmetadata', 'timeupdate'], () => this.syncProgress());
    this.on(audio, ['play', 'pause', 'ended'], () => {
      this.syncPlayState();
      this.emit('aufbau-audio-play', { isPlaying: this.playing });
    });

    this.on('click', ':scope > button', () => this.toggle());

    this.on('input', ':scope > input', (event, input) => {
      const time = Number(input.value) / 100 * audio.duration;
      if (Number.isFinite(time)) audio.currentTime = time;
    });
  }

  onUnmount () { this._audio.pause(); }

  play   () { if (this._audio.src) this._audio.play().catch(error => console.warn('[aufbau-audio] playback refused:', error)); return this; }
  pause  () { this._audio.pause(); return this; }
  toggle () { return this.playing ? this.pause() : this.play(); }

  render () {
    const { artist, cover, label, layout } = this.getAttr();
    const full = layout !== 'minimal';

    return html`
      ${cover && full && html`<img src="${cover}" alt="" />`}
      <strong>${label}</strong>
      ${artist && html`<span>${artist}</span>`}
      <button type="button" aria-label="play"><aufbau-icon icon="lucide:play"></aufbau-icon></button>
      ${full && html`
        <time>0:00</time>
        <input type="range" min="0" max="100" step="0.1" value="0" ${attrs({ 'aria-label': 'seek' })} />
        <time>0:00</time>
      `}
    `;
  }

  sync () {
    const { autoplay, label, loop, src } = this.getAttr();
    const audio = this._audio;

    audio.loop = loop;
    if (src && audio.getAttribute('src') !== src) {
      audio.src = src;
      if (autoplay) this.play();
    }

    if (this._internals) {
      this._internals.role      = 'group';
      this._internals.ariaLabel = label;
    }

    this.syncPlayState();
    this.syncProgress();
  }

  syncPlayState () {
    const playing = this.playing;
    const button  = this.$(':scope > button');

    button?.setAttribute('aria-label', playing ? 'pause' : 'play');
    button?.querySelector('aufbau-icon')?.setAttribute('icon', playing ? 'lucide:pause' : 'lucide:play');
    toggleState(this._internals, 'playing', playing);
  }

  syncProgress () {
    const { currentTime, duration } = this._audio;
    const [current, total] = this.$$(':scope > time');
    const seek = this.$(':scope > input');

    if (current) current.textContent = formatTime(currentTime);
    if (total)   total.textContent   = formatTime(duration);
    if (seek && seek !== document.activeElement && duration) seek.value = String(currentTime / duration * 100);
  }
}

AufbauAudio.init();
