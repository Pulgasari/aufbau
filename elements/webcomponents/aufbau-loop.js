import { AufbauElement } from '@aufbau/element';
import { onVisible }     from '@domina/observer';

// NOTE provisional name, no better one found yet and not happy with it
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

    [part~="track"] ::slotted(*),
    [part~="copy"] > * { flex: none; padding-inline-end: var(--loop-gap, --space(large)); }

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

  onConnected () {
    // the marquee copy follows the children
    this.$(this.root).on('slotchange', () => this.copy());

    this.on('pointerenter', () => { this._hovered = true;  });
    this.on('pointerleave', () => { this._hovered = false; });

    this.track(onVisible(this, (element, entry) => {
      this._offscreen = !entry.isIntersecting;
      this.states.toggle('offscreen', this._offscreen);
    }));

    this.start();
  }

  onDisconnected () { this.stop(); }

  onAttributeChanged (name) {
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
    this.part('copy').node?.replaceChildren(...this.slides.map(slide => slide.cloneNode(true)));
  }

  sync () {
    this.setVar('--loop-speed', this.getAttr('speed'));

    const carousel = this.getAttr('mode') === 'carousel';
    this.slides.forEach((slide, index) => { slide.inert = carousel && index !== this._index; });
  }
}

AufbauLoop.init();
