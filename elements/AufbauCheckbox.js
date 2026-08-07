// <aufbau-toggle>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauToggle extends AufbauElement {
  static attr = {
    checked  : Boolean,
    disabled : Boolean,
    label    : String
  };

  onMount () {
    this.on('click', () => this.toggle());
    this.on('keydown', (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      this.toggle();
    });
  }

  toggle () {
    const { disabled, checked } = this.getAttr();
    if (disabled) return;

    const nextChecked = !checked;
    this.setAttr({ checked: nextChecked });
    this.emit('aufbau-toggle', { checked: nextChecked });
  }

  render () {
    const { label } = this.getAttr();

    return html`
      <button type="button" role="switch" class="aufbau-toggle-btn">
        <span class="thumb"></span>
      </button>
      ${label && html`<span class="toggle-label">${label}</span>`}
    `;
  }

  sync () {
    const { checked, disabled } = this.getAttr();

    dom.element(this.$('.aufbau-toggle-btn'))
      .setAttr({ ariaChecked: String(checked), disabled })
      .toggleClass('is-active', checked);
  }
}

AufbauToggle.init();
