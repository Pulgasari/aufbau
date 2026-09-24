// <aufbau-loop>
// carousel: the authored children are the slides, stacked in one grid cell.
//   the inactive ones are inert, the css fades them out. nothing is cloned.
// marquee: the children move into one track together with an inert,
//   aria-hidden copy, the track scrolls by half its width for a seamless loop.
// both stop while off screen: the carousel skips its ticks, the marquee
// animation is paused through :state(offscreen).

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

  static styles = `aufbau-loop {
    display: block;

    &:not([mode="marquee"]) {
      display: grid;

      > * {
        grid-area  : 1 / 1;
        transition : opacity var(--loop-fade, 0.4s) ease;
      }

      > [inert] { opacity: 0; }
    }

    &[mode="marquee"] {
      overflow: hidden;

      > div {
        animation   : aufbau-loop-marquee var(--loop-speed, 20s) linear infinite;
        display     : flex;
        inline-size : max-content;

        /* a trailing gap on every child keeps the 50% jump exact */
        > * { flex: none; margin-inline-end: var(--loop-gap, 2rem); }
      }

      &[direction="right"] > div          { animation-direction: reverse; }
      &[pause-on-hover]:hover > div       { animation-play-state: paused; }
      &:state(offscreen) > div            { animation-play-state: paused; }
    }
  }

  @keyframes aufbau-loop-marquee { to { translate: -50% 0; } }

  @media (prefers-reduced-motion: reduce) {
    aufbau-loop[mode="marquee"] > div { animation-play-state: paused; }
  }`;

  constructor () {
    super();
    this._index = 0;
  }

  onMount () {
    // the authored children are the slides, captured once before any arranging
    this._slides ??= [...this.children];

    this.on('pointerenter', () => { this._hovered = true;  });
    this.on('pointerleave', () => { this._hovered = false; });

    this.track(onVisible(this, (element, entry) => {
      this._offscreen = !entry.isIntersecting;
      this.states.toggle('offscreen', this._offscreen);
    }));

    this.arrange();
    this.start();
  }

  onUnmount () { this.stop(); }

  onAttributeChange (name) {
    if (name === 'mode') this.arrange();
    this.start();
  }

  // puts the slides where the current mode wants them
  arrange () {
    const slides = this._slides ?? [];

    if (this.getAttr('mode') !== 'marquee') {
      this.replaceChildren(...slides);
      return;
    }

    // the carousel may have left some of them inert
    for (const slide of slides) slide.inert = false;

    const copies = slides.map(slide => {
      const copy = slide.cloneNode(true);
      copy.inert = true;
      copy.setAttribute('aria-hidden', 'true');
      return copy;
    });

    const track = document.createElement('div');
    track.append(...slides, ...copies);
    this.replaceChildren(track);
  }

  // :::::: CAROUSEL ::::::::::::::::::::::::::::::::::::::::::::

  stop () {
    clearInterval(this._timer);
    this._timer = null;
  }

  start () {
    this.stop();

    const { interval, mode } = this.getAttr();
    if (mode !== 'carousel' || (this._slides?.length ?? 0) < 2) return;

    this._timer = setInterval(() => {
      if (this._offscreen || document.hidden) return;
      if (this._hovered && this.getAttr('pauseOnHover')) return;
      this.next();
    }, interval);
  }

  next     () { return this.goTo(this._index + 1); }
  previous () { return this.goTo(this._index - 1); }

  goTo (index) {
    const count = this._slides?.length ?? 0;
    if (!count) return this;

    this._index = ((index % count) + count) % count;
    this.sync();
    this.emit('aufbau-loop-change', { index: this._index });
    return this;
  }

  render () { return null; }

  sync () {
    this.style.setProperty('--loop-speed', this.getAttr('speed'));

    if (this.getAttr('mode') !== 'carousel') return;
    (this._slides ?? []).forEach((slide, index) => { slide.inert = index !== this._index; });
  }
}

AufbauLoop.init();
