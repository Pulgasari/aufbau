// <aufbau-progress>

import { AufbauElement } from './core/index.js';

export default class AufbauProgress extends AufbauElement {
  static attr = {
    value    : Number,
    max      : 100,
    type     : 'standard',
    target   : String,
    showText : Boolean,
    unit     : '%'
  };

  static styles = `
    aufbau-progress {
      display: block;
      --progress-size: 0.5em;
    }

    aufbau-progress .aufbau-progress-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
      inline-size: 100%;
      block-size: var(--progress-size);
      overflow: hidden;
    }

    aufbau-progress .progress-bar {
      block-size: 100%;
      transition: inline-size 0.2s ease;
    }

    aufbau-progress .is-indeterminate .progress-bar {
      inline-size: 35% !important;
      animation: aufbau-progress-slide 1.2s ease-in-out infinite;
    }

    aufbau-progress .progress-text {
      position: absolute;
      inset-inline-end: 0;
      font-size: 0.75em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    @keyframes aufbau-progress-slide {
      0%   { translate: -100% 0; }
      100% { translate: 300% 0; }
    }
  `;

  onMount () {
    this._onScroll = this._onScroll.bind(this);
    this.setupScrollListener();
  }

  onUnmount () {
    this.removeScrollListener();
  }

  onAttributeChange (name) {
    if (name === 'target' || name === 'type') {
      this.setupScrollListener();
    }
  }

  setupScrollListener () {
    this.removeScrollListener();

    const { type, target: targetQuery } = this.getAttr();
    if (type !== 'scroll') return;

    this._scrollTarget = targetQuery
      ? (targetQuery === 'body' ? window : document.querySelector(targetQuery))
      : window;

    if (this._scrollTarget) {
      this._scrollTarget.addEventListener('scroll', this._onScroll, { passive: true });
      this._onScroll();
    }
  }

  removeScrollListener () {
    if (this._scrollTarget) {
      this._scrollTarget.removeEventListener('scroll', this._onScroll);
      this._scrollTarget = null;
    }
  }
  
  _onScroll () {
    const { type } = this.getAttr(); 
    if (type !== 'scroll') return;

    let percentage = 0;

    if (this._scrollTarget === window || this._scrollTarget === document.body) {
      const docEl       = document.documentElement;
      const totalScroll = docEl.scrollHeight - docEl.clientHeight;
      percentage = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
    } 
    else if (this._scrollTarget instanceof HTMLElement) {
      const el          = this._scrollTarget;
      const totalScroll = el.scrollHeight - el.clientHeight;
      percentage = totalScroll > 0 ? (el.scrollTop / totalScroll) * 100 : 0;
    }

    const value = Math.min(100, Math.max(0, percentage)).toFixed(1);
    this.setAttr({ value });
  }

  /**
   * structure only — the width, text and indeterminate state are per-value and
   * applied in sync(). that lets the base update() diff the (unchanging) markup
   * away, so a scroll progress bar restyles instead of rebuilding its dom on
   * every scroll frame.
   */
  render () {
    const showText = this.getAttr('showText');
    return `
      <div class="aufbau-progress-wrapper">
        <div class="progress-bar"></div>
        ${showText ? '<span class="progress-text"></span>' : ''}
      </div>
    `;
  }

  sync () {
    const { value, max, type, unit } = this.getAttr();

    const isIndeterminate = (value === undefined) && type !== 'scroll';
    const percentage      = isIndeterminate ? 0 : Math.min(100, Math.max(0, ((value ?? 0) / max) * 100));

    const wrapper = this.$('.aufbau-progress-wrapper');
    const bar     = this.$('.progress-bar');
    const text    = this.$('.progress-text');

    wrapper?.classList.toggle('is-indeterminate', isIndeterminate);
    if (bar)  bar.style.width = `${percentage}%`;
    if (text) text.textContent = isIndeterminate ? '' : `${Math.round(percentage)}${unit}`;
  }
}

AufbauProgress.init();
