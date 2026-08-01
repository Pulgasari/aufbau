// <aufbau-dropdown>

import AufbauElement from './AufbauElement.js';

export class AufbauDropdown extends AufbauElement {
  static get observedAttributes () { return ['label', 'open']; }

  update () {
    const label    = this.getAttr('label', String, 'Menu');
    const { open } = this.getAttr(Boolean);

    this.innerHTML = `
      <details class="aufbau-dropdown-wrapper" ${open ? 'open' : ''}>
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

AufbauDropdown.init();
