// <aufbau-checkbox>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauCheckbox extends AufbauElement {
  static attr = {
    checked       : Boolean,
    disabled      : Boolean,
    indeterminate : Boolean,
    label         : String,
    value         : 'on',
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
    const { disabled, checked, value } = this.getAttr();
    if (disabled) return;

    const nextChecked = !checked;
    // a user interaction always resolves the mixed state
    this.setAttr({ checked: nextChecked, indeterminate: false });
    this.emit('aufbau-checkbox', { checked: nextChecked, value });
  }

  // structure only. checked/disabled/indeterminate are written in sync()
  render () {
    const { label } = this.getAttr();

    return html`
      <label class="aufbau-checkbox-wrapper">
        <button type="button" role="checkbox" class="checkbox-box">
          <aufbau-icon></aufbau-icon>
        </button>
        ${label && html`<span class="checkbox-label">${label}</span>`}
      </label>
    `;
  }

  sync () {
    const { checked, disabled, indeterminate } = this.getAttr();

    dom.element(this.$('.aufbau-checkbox-wrapper')).toggleClass('is-disabled', disabled);

    dom.element(this.$('.checkbox-box'))
      .setAttr({ ariaChecked: indeterminate ? 'mixed' : String(checked), disabled })
      .toggleClass({ 'is-checked': checked, 'is-indeterminate': indeterminate });

    dom.setAttr(this.$('aufbau-icon'), { icon: indeterminate ? 'lucide:minus' : 'lucide:check' });
  }
}

AufbauCheckbox.init();
