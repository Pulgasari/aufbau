// <aufbau-progress>

import AufbauElement from './AufbauElement.js';

export default class AufbauProgress extends AufbauElement {
  static attr = {
    value    : Number,
    max      : 100,
    type     : 'standard',
    target   : String,
    showText : Boolean,
    unit     : '%'
  };

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
    } else if (this._scrollTarget instanceof HTMLElement) {
      const el          = this._scrollTarget;
      const totalScroll = el.scrollHeight - el.clientHeight;
      percentage = totalScroll > 0 ? (el.scrollTop / totalScroll) * 100 : 0;
    }

    const val = Math.min(100, Math.max(0, percentage)).toFixed(1);
    this.setAttributes({ value: val });
  }

  update () {
    const { value, max, type, showText, unit } = this.getAttr();

    const isIndeterminate = (value === undefined) && type !== 'scroll';
    const val = value ?? 0;
    const percentage = isIndeterminate ? 0 : Math.min(100, Math.max(0, (val / max) * 100));

    this.innerHTML = `
      <div class="aufbau-progress-wrapper ${isIndeterminate ? 'is-indeterminate' : ''}">
        <div class="progress-bar" style="width: ${percentage}%;"></div>
        ${showText && !isIndeterminate ? `
          <span class="progress-text">${Math.round(percentage)}${unit}</span>
        ` : ''}
      </div>
    `;
  }
}

AufbauProgress.init();
