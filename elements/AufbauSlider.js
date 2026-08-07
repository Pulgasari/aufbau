// <aufbau-slider>

import { AufbauElement } from './core/index.js';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauSlider extends AufbauElement {
  static attr = {
    value    : 0,
    min      : 0,
    max      : 100,
    step     : 1,
    unit     : String,
    controls : Boolean,
    editable : Boolean,
    disabled : Boolean
  };

  onMount () {
    this.on('input', '.slider-range, .slider-number-input', (e, input) => this.setValue(input.value));
    this.on('click', '[data-step]', (e, btn) => {
      if (this.getAttr('disabled')) return;
      this.stepBy(parseInt(btn.dataset.step, 10));
    });
  }

  stepBy (direction) {
    const { step, value } = this.getAttr();
    this.setValue(value + direction * step);
  }

  setValue (val) {
    const { min, max } = this.getAttr();
    const value = Math.max(min, Math.min(max, parseFloat(val) || 0));
    this.setAttr({ value });
    this.emit('aufbau-slider', { value });
  }

  /**
   * structure only. value and disabled are deliberately absent, otherwise every
   * keystroke would rebuild the markup and drop focus out of the number input.
   */
  render () {
    const { min, max, step, unit, controls, editable } = this.getAttr();

    const stepBtn = (dir, icon) => html`
      <button type="button" class="btn-step btn-${dir > 0 ? 'inc' : 'dec'}" data-step="${dir}">
        <aufbau-icon icon="${icon}"></aufbau-icon>
      </button>
    `;

    return html`
      <div class="aufbau-slider-wrapper">
        ${controls && stepBtn(-1, 'lucide:minus')}

        <input type="range" class="slider-range" min="${min}" max="${max}" step="${step}" />

        ${controls && stepBtn(1, 'lucide:plus')}

        <div class="slider-display">
          ${editable
            ? html`<input type="number" class="slider-number-input" min="${min}" max="${max}" step="${step}" />`
            : html`<span class="slider-value-text"></span>`}
          ${unit && html`<span class="slider-unit">${unit}</span>`}
        </div>
      </div>
    `;
  }

  sync () {
    const { value, disabled } = this.getAttr();

    dom.element(this.$('.aufbau-slider-wrapper')).toggleClass('is-disabled', disabled);

    for (const input of this.$$('.slider-range, .slider-number-input')) {
      // never write back into the field the user is typing in
      if (input !== document.activeElement) dom.setValue(input, value);
      dom.setAttr(input, { disabled });
    }

    dom.setAttr(this.$$('[data-step]'), { disabled });

    const text = this.$('.slider-value-text');
    if (text) text.textContent = value;
  }
}

AufbauSlider.init();
