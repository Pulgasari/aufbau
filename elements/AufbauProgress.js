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

/*

// <aufbau-progress>

import AufbauElement from './AufbauElement.js';

export class AufbauProgress extends AufbauElement {
  static get observedAttributes() {
    return ['value', 'max', 'type', 'target', 'show-text', 'unit'];
  }

  onMount() {
    this.setupScrollListener();
  }

  onUnmount() {
    // Single cleanup call
    this._unsubScroll?.();
  }

  onAttributeChange(name) {
    if (name === 'target' || name === 'type') {
      this.setupScrollListener();
    }
  }

  setupScrollListener() {
    // Unsubscribe existing listener if present
    this._unsubScroll?.();
    this._unsubScroll = null;

    if (this.getAttribute('type') !== 'scroll') return;

    const targetQuery = this.getAttribute('target');
    const target = targetQuery
      ? (targetQuery === 'body' ? window : document.querySelector(targetQuery))
      : window;

    if (!target) return;

    const handleScroll = () => this._updateScrollProgress(target);

    // Attach listener and store cleanup callback directly
    target.addEventListener('scroll', handleScroll, { passive: true });
    this._unsubScroll = () => target.removeEventListener('scroll', handleScroll);

    // Initial calculation
    handleScroll();
  }

  _updateScrollProgress(target) {
    let percentage = 0;

    if (target === window || target === document.body) {
      const docEl = document.documentElement;
      const totalScroll = docEl.scrollHeight - docEl.clientHeight;
      percentage = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
    } else if (target instanceof HTMLElement) {
      const totalScroll = target.scrollHeight - target.clientHeight;
      percentage = totalScroll > 0 ? (target.scrollTop / totalScroll) * 100 : 0;
    }

    this.setAttribute('value', Math.min(100, Math.max(0, percentage)).toFixed(1));
  }

  update() {
    const type      = this.getAttribute('type') || 'standard';
    const valueAttr = this.getAttribute('value');
    const max       = parseFloat(this.getAttribute('max') || '100');
    const unit      = this.getAttribute('unit') || '%';
    const showText  = this.hasAttribute('show-text');

    const isIndeterminate = valueAttr === null && type !== 'scroll';
    const val = parseFloat(valueAttr || '0');
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

customElements.define('aufbau-progress', AufbauProgress);
export default AufbauProgress;

*/
