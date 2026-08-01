// <aufbau-slider>

import AufbauElement from './AufbauElement.js';

export class AufbauSlider extends AufbauElement {
  static get observedAttributes () {
    return ['value', 'min', 'max', 'step', 'unit', 'controls', 'editable', 'disabled'];
  }

  onMount () {
    this.on('input', (e) => {
      if (e.target.matches('.slider-range, .slider-number-input')) this.setValue(e.target.value);
    });

    this.on('click', (e) => {
      const btn = e.target.closest('[data-step]');
      if (!btn || this.hasAttribute('disabled')) return;
      this.stepBy(parseInt(btn.dataset.step, 10));
    });
  }

  stepBy (direction) {
    const { step = 1, value = 0 } = this.getAttributes(Number);
    this.setValue(value + direction * step);
  }

  setValue (val) {
    const { min = 0, max = 100 } = this.getAttributes(Number);

    const value = Math.max(min, Math.min(max, parseFloat(val) || 0));
    this.setAttributes({ value });
    this.emit('aufbau-slider', { value });
  }

  update () {
    const { max = 100, min = 0, step = 1, value = 0 } = this.getAttributes(Number);
    const unit = this.attr('unit', String, '');
    const { controls, editable, disabled } = this.getAttributes(Boolean);

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

if (!customElements.get('aufbau-slider')) customElements.define('aufbau-slider', AufbauSlider);
export default AufbauSlider;
