// <aufbau-dropdown>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauDropdown extends AufbauElement {
  static attr = {
    label : 'Menu',
    open  : Boolean,
  };

  onMount () {
    // light dom has no slots, so the original children are moved into the
    // rendered shell after every structural rebuild
    this._content ??= [...this.childNodes];

    this.on('toggle', '.aufbau-dropdown-wrapper', (e, details) => {
      this.setAttr({ open: details.open });
      this.emit('aufbau-dropdown', { open: details.open });
    });

    this.onOutside(() => this.setAttr({ open: false }));
  }

  render () {
    const { label } = this.getAttr();

    return html`
      <details class="aufbau-dropdown-wrapper">
        <summary class="aufbau-dropdown-trigger">
          <span>${label}</span>
          <aufbau-icon icon="lucide:chevron-down"></aufbau-icon>
        </summary>
        <div class="aufbau-dropdown-content"></div>
      </details>
    `;
  }

  onRender () {
    this.$('.aufbau-dropdown-content')?.append(...(this._content ?? []));
  }

  sync () {
    dom.setAttr(this.$('.aufbau-dropdown-wrapper'), { open: this.getAttr('open') });
  }
}

AufbauDropdown.init();
