// <aufbau-loop>
// carousel: the children are the slides, stacked in one grid cell. the inactive
//   ones are inert, the css fades them out. nothing is cloned or moved.
// marquee: the children are projected into a track in the shadow root, next to
//   an inert, aria-hidden copy of them. the track scrolls by half its width for
//   a seamless loop. the copy is rebuilt whenever the children change; it sits
//   in the shadow root, so page css that targets the originals by selector does
//   not reach it, inherited styles do.
// both stop while off screen: the carousel skips its ticks, the marquee
// animation is paused through :state(offscreen). parts: track, copy

import { AufbauElement } from './core/index.js';
import { onVisible }     from '@domina/observer';

export default class AufbauLoop extends AufbauElement {
  static reflect = ['direction', 'mode'];

  static attr = {
    direction    : { type: String, default: 'left', values: ['left', 'right'] },
    interval     : 3000,
    mode         : { type: String, default: 'carousel', values: ['carousel', 'marquee'] },
    pauseOnHover : Boolean,
    speed        : '20s',
  };

  static shadow = true;

  static styles = `
    :host { display: block; }

    :host(:not([mode="marquee"])) { display: grid; }

    :host(:not([mode="marquee"])) ::slotted(*) {
      grid-area  : 1 / 1;
      transition : opacity var(--loop-fade, 0.4s) ease;
    }

    :host(:not([mode="marquee"])) ::slotted([inert]) { opacity: 0; }

    :host([mode="marquee"]) { overflow: hidden; }

    [part~="track"] {
      animation   : aufbau-loop-marquee var(--loop-speed, 20s) linear infinite;
      display     : flex;
      inline-size : max-content;
    }

    [part~="copy"] { display: contents; }

    /* a trailing gap on every item keeps the 50% jump exact */
    [part~="track"] ::slotted(*),
    [part~="copy"] > * { flex: none; margin-inline-end: var(--loop-gap, 2rem); }

    :host([direction="right"]) [part~="track"]    { animation-direction: reverse; }
    :host([pause-on-hover]:hover) [part~="track"] { animation-play-state: paused; }
    :host(:state(offscreen)) [part~="track"]      { animation-play-state: paused; }

    @keyframes aufbau-loop-marquee { to { translate: -50% 0; } }

    @media (prefers-reduced-motion: reduce) {
      [part~="track"] { animation-play-state: paused; }
    }
  `;

  constructor () {
    super();
    this._index = 0;
  }

  onMount () {
    // the marquee copy follows the children
    this.on(this.root, 'slotchange', () => this.copy());

    this.on('pointerenter', () => { this._hovered = true;  });
    this.on('pointerleave', () => { this._hovered = false; });

    this.track(onVisible(this, (element, entry) => {
      this._offscreen = !entry.isIntersecting;
      this.states.toggle('offscreen', this._offscreen);
    }));

    this.start();
  }

  onUnmount () { this.stop(); }

  onAttributeChange (name) {
    this.start();
  }

  // :::::: CAROUSEL ::::::::::::::::::::::::::::::::::::::::::::

  stop () {
    clearInterval(this._timer);
    this._timer = null;
  }

  start () {
    this.stop();

    const { interval, mode } = this.getAttr();
    if (mode !== 'carousel' || this.slides.length < 2) return;

    this._timer = setInterval(() => {
      if (this._offscreen || document.hidden) return;
      if (this._hovered && this.getAttr('pauseOnHover')) return;
      this.next();
    }, interval);
  }

  next     () { return this.goTo(this._index + 1); }
  previous () { return this.goTo(this._index - 1); }

  goTo (index) {
    const count = this.slides.length;
    if (!count) return this;

    this._index = ((index % count) + count) % count;
    this.sync();
    this.emit('aufbau-loop-change', { index: this._index });
    return this;
  }

  get slides () { return [...this.children]; }

  render () {
    return this.getAttr('mode') === 'marquee'
      ? '<div part="track"><slot></slot><div part="copy" aria-hidden="true" inert></div></div>'
      : '<slot></slot>';
  }

  // the track is new after a mode switch, it needs its copy
  onRender () { this.copy(); }

  copy () {
    const copy = this.$('[part~="copy"]');
    copy?.replaceChildren(...this.slides.map(slide => slide.cloneNode(true)));
  }

  sync () {
    this.style.setProperty('--loop-speed', this.getAttr('speed'));

    // inert is an attribute on the author's elements, they are not moved or rewritten
    const carousel = this.getAttr('mode') === 'carousel';
    this.slides.forEach((slide, index) => { slide.inert = carousel && index !== this._index; });
  }
}

AufbauLoop.init();
