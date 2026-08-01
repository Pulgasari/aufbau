// <aufbau-slider>

import AufbauElement from './AufbauElement.js';

export class AufbauSlider extends AufbauElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'step', 'unit', 'controls', 'editable', 'disabled'];
  }

  onMount() {
    // Synchronize range slider and editable number input
    this.addEventListener('input', (e) => {
      if (e.target.matches('.slider-range') || e.target.matches('.slider-number-input')) {
        this.setValue(e.target.value);
      }
    });

    // Handle inc/dec buttons if controls attribute is present
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-step]');
      if (!btn || this.hasAttribute('disabled')) return;
      const direction = parseInt(btn.dataset.step, 10);
      this.stepBy(direction);
    });
  }

  stepBy(direction) {
    const step    = parseFloat(this.getAttribute('step')  || '1');
    const current = parseFloat(this.getAttribute('value') || '0');
    this.setValue(current + direction * step);
  }
  stepBy (direction) {
    const current = this.numAttr('value', 0);
    const step    = this.numAttr('step', 1);
    this.setValue(current + direction * step);
  }
  stepBy (direction) {
    const { current = 0, step = 1 } = this.numAttrs;
    this.setValue(current + direction * step);
  }
  stepBy (direction) {
    const { current = 0, step = 1 } = this.attrsAsNum;
    this.setValue(current + direction * step);
  }
  stepBy (direction) {
    const { current = 0, step = 1 } = this.attrs('num');
    this.setValue(current + direction * step);
  }
  stepBy (direction) {
    const { current = 0, step = 1 } = this.attrs(Number);
    this.setValue(current + direction * step);
  }

  setValue(val) {
    const min = this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : 0;
    const max = this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : 100;
    
    let clamped = Math.max(min, Math.min(max, parseFloat(val) || 0));
    this.setAttribute('value', clamped.toString());
    this.emit('aufbau-slider', { value: clamped });
  }

  update() {
    const value       = this.getAttribute('value') || '0';
    const min         = this.getAttribute('min')   || '0';
    const max         = this.getAttribute('max')   || '100';
    const step        = this.getAttribute('step')  || '1';
    const unit        = this.getAttribute('unit')  || '';
    const hasControls = this.hasAttribute('controls');
    const isEditable  = this.hasAttribute('editable');
    const isDisabled  = this.hasAttribute('disabled');

    const { max, min, step, unit, value } = this.attributes;

    this.innerHTML = `
      <div class="aufbau-slider-wrapper ${isDisabled ? 'is-disabled' : ''}">
        ${hasControls ? `
          <button type="button" class="btn-step btn-dec" data-step="-1" ${isDisabled ? 'disabled' : ''}>
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
          ${isDisabled ? 'disabled' : ''}
        />

        ${hasControls ? `
          <button type="button" class="btn-step btn-inc" data-step="1" ${isDisabled ? 'disabled' : ''}>
            <aufbau-icon icon="lucide:plus"></aufbau-icon>
          </button>
        ` : ''}

        <div class="slider-display">
          ${isEditable ? `
            <input 
              type="number" 
              class="slider-number-input" 
              value="${value}" 
              min="${min}" 
              max="${max}" 
              step="${step}"
              ${isDisabled ? 'disabled' : ''}
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

customElements.define('aufbau-slider', AufbauSlider);
