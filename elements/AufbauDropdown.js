// <aufbau-dropdown>

import AufbauElement from './AufbauElement.js';

export class AufbauDropdown extends AufbauElement {
  static get observedAttributes() {
    return ['label', 'open'];
  }

  update() {
    const label  = this.getAttribute('label') || 'Menu';
    const isOpen = this.hasAttribute('open');

    this.innerHTML = `
      <details class="aufbau-dropdown-wrapper" ${isOpen ? 'open' : ''}>
        <summary class="aufbau-dropdown-trigger">
          <span>${label}</span>
          <aufbau-icon icon="lucide:chevron-down"></aufbau-icon>
        </summary>
        <div class="aufbau-dropdown-content">
          <slot></slot>
        </div>
      </details>
    `;
  }
}

customElements.define('aufbau-dropdown', AufbauDropdown);
export default AufbauDropdown;
