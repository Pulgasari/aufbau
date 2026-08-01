// <aufbau-number>

import AufbauElement from './AufbauElement.js';

export default class AufbauNumber extends AufbauElement {
  static attr = ['value', 'min', 'max', 'step', 'disabled', 'unit'];

  onMount () {
    this.on('click', (e) => {
      const btn = e.target.closest('[data-step]');
      if (!btn || this.hasAttribute('disabled')) return;
      this.stepBy(parseInt(btn.dataset.step, 10));
    });

    this.on('change', (e) => {
      if (e.target.matches('.number-input')) this.setValue(e.target.value);
    });
  }

  stepBy (direction) {
    const { step = 1, value = 0 } = this.getAttr(Number);
    this.setValue(value + direction * step);
  }

  setValue (val) {
    const { min = -Infinity, max = Infinity } = this.getAttr(Number);

    const value = Math.max(min, Math.min(max, parseFloat(val) || 0));
    this.setAttr({ value });
    this.emit('aufbau-number', { value });
  }

  update () {
    const { max, min, step = 1, value = 0 } = this.getAttributes(Number);
    const { unit }     = this.getAttr(String);
    const { disabled } = this.getAttr(Boolean);

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
