import { AufbauElement } from '@aufbau/element';
import { attrs, html }   from '../lib/html.js';

// a gif that can stop: paused, a still of its current frame covers it. starts
// paused where the reader asked for reduced motion. a click toggles it
const REDUCED = () => matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default class MediaGif extends AufbauElement {
  static attr = {
    alt    : String,
    paused : Boolean,
    src    : String,
  };

  static reflect = ['paused'];

  static styles = `media-gif {
    cursor   : pointer;
    display  : inline-block;
    position : relative;

    > img, > canvas { display: block; max-inline-size: 100%; block-size: auto; }
    > canvas        { inset: 0; position: absolute; inline-size: 100%; block-size: 100%; }
    &:not([paused]) > canvas { display: none; }

    > span {
      background    : color-mix(in oklch, black 60%, transparent);
      border-radius : 0.3em;
      color         : white;
      font-size     : 0.75em;
      font-weight   : 700;
      inset         : auto auto 0.5em 0.5em;
      padding       : 0.1em 0.4em;
      position      : absolute;
    }
    &:not([paused]) > span { display: none; }
  }`;

  constructor () {
    super();
    if (REDUCED()) this._startPaused = true;
  }

  onConnected () {
    if (this._startPaused && !this.hasAttribute('paused')) this.setAttribute('paused', '');
    this.on('click', () => this.toggle());
    this.on('keydown', event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); this.toggle(); } });
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
  }

  play   () { return this.setAttr({ paused: false }); }
  pause  () { return this.setAttr({ paused: true }); }
  toggle () { return this.getAttr('paused') ? this.play() : this.pause(); }

  render () {
    const { alt, src } = this.getAttr();
    if (!src) return '';
    return html`<img ${attrs({ alt: alt ?? '', src })}><canvas aria-hidden="true"></canvas><span aria-hidden="true">GIF</span>`;
  }

  // the still is the frame that is showing right now
  freeze () {
    const img    = this.querySelector('img');
    const canvas = this.querySelector('canvas');
    if (!img || !canvas) return;
    const draw = () => {
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
    };
    img.complete ? draw() : img.addEventListener('load', draw, { once: true });
  }

  sync () {
    const paused = this.getAttr('paused');
    if (paused) this.freeze();
    if (this.internals) {
      this.internals.role        = 'button';
      this.internals.ariaLabel   = this.getAttr('alt') || 'animation';
      this.internals.ariaPressed = String(!paused);   // pressed is playing
    }
  }
}

MediaGif.init();
