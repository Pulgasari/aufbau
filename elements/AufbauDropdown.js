// <aufbau-dropdown>

import AufbauElement from './AufbauElement.js';

export default class AufbauDropdown extends AufbauElement {
  static attr = {
    label : 'Menu',
    open  : Boolean,
  };

  update () {
    const { label, open } = this.getAttr();

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
