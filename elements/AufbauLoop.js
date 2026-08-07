// <aufbau-loop>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauLoop extends AufbauElement {
  static attr = {
    mode         : { type: String, default: 'carousel', values: ['carousel', 'marquee'] },
    interval     : 3000,
    speed        : '20s',
    direction    : { type: String, default: 'left', values: ['left', 'right'] },
    pauseOnHover : Boolean,
  };

  onMount () {
    this._index = 0;
    // the original children are the slides and get wiped by the first render
    this._items ??= [...this.children].map(child => child.cloneNode(true));

    // pointerenter/leave instead of mouseenter/leave: those do not bubble and
    // cannot be delegated. registered once here, never inside setupLoop()
    this.on('pointerenter', () => this._paused = true);
    this.on('pointerleave', () => this._paused = false);

    // a carousel in a background tab or off screen does not need to tick
    this.track(dom.onVisible(this, (el, entry) => {
      this._offscreen = !entry.isIntersecting;
    }));

    this.startLoop();
  }

  onUnmount () { this.stopLoop(); }

  onAttributeChange () { this.startLoop(); }

  stopLoop () {
    clearInterval(this._timer);
    this._timer = null;
  }

  startLoop () {
    this.stopLoop();

    const { mode, interval } = this.getAttr();
    if (mode !== 'carousel' || (this._items?.length ?? 0) < 2) return;

    this._timer = setInterval(() => {
      if (this._offscreen) return;
      if (this._paused && this.getAttr('pauseOnHover')) return;
      this.next();
    }, interval);
  }

  next () {
    this._index = (this._index + 1) % this._items.length;
    this.sync();
    this.emit('aufbau-loop-change', { index: this._index });
  }

  goTo (index) {
    this._index = ((index % this._items.length) + this._items.length) % this._items.length;
    this.sync();
  }

  render () {
    const { mode, direction, speed } = this.getAttr();
    const items = this._items ??= [...this.children].map(child => child.cloneNode(true));

    // marquee duplicates the content for a seamless loop, the copy is aria-hidden
    if (mode === 'marquee') {
      return html`
        <div class="aufbau-loop-wrapper mode-marquee dir-${direction}">
          <div class="marquee-track" style="animation-duration: ${speed};">
            <div class="marquee-content"></div>
            <div class="marquee-content" aria-hidden="true"></div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="aufbau-loop-wrapper mode-carousel">
        <div class="loop-track">
          ${items.map(() => html`<div class="loop-item"></div>`)}
        </div>
      </div>
    `;
  }

  /** the slides are real nodes, so they are appended after a structural rebuild */
  onRender () {
    const items = this._items ?? [];

    for (const container of this.$$('.marquee-content')) {
      container.append(...items.map(item => item.cloneNode(true)));
    }

    this.$$('.loop-item').forEach((slot, i) => slot.append(items[i].cloneNode(true)));
  }

  sync () {
    this.$$('.loop-item').forEach((item, i) => item.classList.toggle('is-active', i === this._index));
  }
}

AufbauLoop.init();
