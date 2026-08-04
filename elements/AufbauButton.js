// <aufbau-button>

import { AufbauElement } from './core/index.js';

export default class AufbauButton extends AufbauElement {
  static attr = {
    icon     : String, 
    label    : String, 
    text     : String, 
    disabled : false, 
    type     : 'button',
    variant  : 'default',
  ];

  onMount () {
    // preserve initial light-DOM children if no explicit label was given
    if (!this.hasAttribute('label') && !this.hasAttribute('text') && !this._originalChildren) {
      this._originalChildren = this.innerHTML;
    }
  }

  update () {
    const { disabled, icon, label, text, type, variant } = this.getAttr();
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
