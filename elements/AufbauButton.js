// <aufbau-button>

import AufbauElement from './AufbauElement.js';

export class AufbauButton extends AufbauElement {
  static get observedAttributes() {
    return ['icon', 'label', 'text', 'disabled', 'type', 'variant'];
  }

  onMount() {
    // Preserve initial light-DOM children if no explicit label attribute was given
    if (!this.hasAttribute('label') && !this.hasAttribute('text') && !this._originalChildren) {
      this._originalChildren = this.innerHTML;
    }
  }

  update() {
    const icon    = this.getAttribute('icon');
    const label   = this.getAttribute('label')      || this.getAttribute('text');
    const content = label || this._originalChildren || '';
    const type    = this.getAttribute('type')       || 'button';
    const variant = this.getAttribute('variant')    || 'default';

    this.innerHTML = `
      <button 
        type="${type}" 
        class="aufbau-btn variant-${variant}" 
        ${this.hasAttribute('disabled') ? 'disabled' : ''}
      >
        ${icon ? `<aufbau-icon icon="${icon}"></aufbau-icon>` : ''}
        ${content ? `<span class="btn-content">${content}</span>` : ''}
      </button>
    `;
  }
}

customElements.define('aufbau-button', AufbauButton);
export default AufbauButton;
