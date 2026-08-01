// <aufbau-number>

import AufbauElement from './AufbauElement.js';

export default class AufbauNumber extends AufbauElement {
  
  static attr = {
    value    : 0,
    min      : Number,
    max      : Number,
    step     : 1,
    disabled : Boolean,
    unit     : String,
  };

  onMount () {
    this.on('click', (e) => {
      const btn = e.target.closest('[data-step]');
      // Check disabled state via schema-based Boolean
      if (!btn || this.getAttr('disabled')) return;
      this.stepBy(parseInt(btn.dataset.step, 10));
    });

    this.on('change', (e) => {
      if (e.target.matches('.number-input')) this.setValue(e.target.value);
    });
  }

  stepBy (direction) {
    const { step, value } = this.getAttr();
    this.setValue(value + direction * step);
  }

  setValue (val) {
    const { min, max } = this.getAttr();
    const parsedVal = parseFloat(val) || 0;
    const minBound = min ?? -Infinity;
    const maxBound = max ??  Infinity;

    const value = Math.max(minBound, Math.min(maxBound, parsedVal));
    
    this.setAttributes({ value });
    this.emit('aufbau-number', { value });
  }

  update () {
    // One single call extracts ALL attributes with accurate types & fallbacks
    const { value, min, max, step, disabled, unit } = this.getAttr();

    this.innerHTML = `
      <div class="aufbau-number-wrapper ${disabled ? 'is-disabled' : ''}">
        <button type="button" class="btn-step btn-dec" data-step="-1" ${disabled ? 'disabled' : ''}>
          <aufbau-icon icon="lucide:minus"></aufbau-icon>
        </button>
        <div class="input-unit-group">
          <input
            type="number"
            class="number-input"
            value="${value}"
            ${min !== undefined ? `min="${min}"` : ''}
            ${max !== undefined ? `max="${max}"` : ''}
            step="${step}"
            ${disabled ? 'disabled' : ''}
          />
          ${unit ? `<span class="number-unit">${unit}</span>` : ''}
        </div>
        <button type="button" class="btn-step btn-inc" data-step="1" ${disabled ? 'disabled' : ''}>
          <aufbau-icon icon="lucide:plus"></aufbau-icon>
        </button>
      </div>
    `;
  }
}

AufbauNumber.init();
