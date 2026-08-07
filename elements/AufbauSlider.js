// <aufbau-slider>

import { AufbauElement } from './core/index.js';

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
    this.on('input', (e) => {
      if (e.target.matches('.slider-range, .slider-number-input')) this.setValue(e.target.value);
    });

    this.on('click', (e) => {
      const btn = e.target.closest('[data-step]');
      if (!btn || this.getAttr('disabled')) return;
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

  update () {
    const { value, min, max, step, unit, controls, editable, disabled } = this.getAttr();

    this.innerHTML = `
      <div class="aufbau-slider-wrapper ${disabled ? 'is-disabled' : ''}">
        ${controls ? `
          <button type="button" class="btn-step btn-dec" data-step="-1" ${disabled ? 'disabled' : ''}>
            <aufbau-icon icon="lucide:minus"></aufbau-icon>
          </button>
        ` : ''}

        <input
          type="range"
          class="slider-range"
          value="${value}"
          min="${min}"
          max="${max}"
          step="${step}"
          ${disabled ? 'disabled' : ''}
        />

        ${controls ? `
          <button type="button" class="btn-step btn-inc" data-step="1" ${disabled ? 'disabled' : ''}>
            <aufbau-icon icon="lucide:plus"></aufbau-icon>
          </button>
        ` : ''}

        <div class="slider-display">
          ${editable ? `
            <input
              type="number"
              class="slider-number-input"
              value="${value}"
              min="${min}"
              max="${max}"
              step="${step}"
              ${disabled ? 'disabled' : ''}
            />
          ` : `
            <span class="slider-value-text">${value}</span>
          `}
          ${unit ? `<span class="slider-unit">${unit}</span>` : ''}
        </div>
      </div>
    `;
  }
}

AufbauSlider.init();
