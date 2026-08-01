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
