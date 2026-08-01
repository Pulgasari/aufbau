// <aufbau-button>

import AufbauElement from './AufbauElement.js';

export default class AufbauButton extends AufbauElement {
  static get observedAttributes () {
    return ['icon', 'label', 'text', 'disabled', 'type', 'variant'];
  }

  onMount () {
    // preserve initial light-DOM children if no explicit label was given
    if (!this.hasAttribute('label') && !this.hasAttribute('text') && !this._originalChildren) {
      this._originalChildren = this.innerHTML;
    }
  }

  update () {
    const { icon, label, text, type = 'button', variant = 'default' } = this.getAttr();
    const { disabled } = this.getAttr(Boolean);
    const content = label || text || this._originalChildren || '';

    this.innerHTML = `
      <button
        type="${type}"
        class="aufbau-btn variant-${variant}"
        ${disabled ? 'disabled' : ''}
      >
        ${icon    ? `<aufbau-icon icon="${icon}"></aufbau-icon>`      : ''}
        ${content ? `<span class="btn-content">${content}</span>` : ''}
      </button>
    `;
  }
}

AufbauButton.init();
