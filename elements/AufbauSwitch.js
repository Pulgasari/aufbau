// <aufbau-switch>

import { AufbauElement } from './AufbauElement.js';

export default class AufbauSwitch extends AufbauElement {
  static attr = {
    value : String,
    mode  : 'buttons' // 'buttons' | 'dropdown'
  };

  onMount () {
    this.on('click', (e) => {
      const btn = e.target.closest('[data-value]');
      if (btn) {
        const value = btn.dataset.value;
        this.setAttr({ value });
        this.emit('aufbau-switch', { value });
      }
    });

    this.on('change', (e) => {
      if (e.target.matches('.aufbau-switch-select')) {
        const value = e.target.value;
        this.setAttributes({ value });
        this.emit('aufbau-switch', { value });
      }
    });
  }

  update () {
    const { value: currentValue, mode } = this.getAttr();
    const options = this.$$('option, [data-value]').map(opt => ({
      value: opt.getAttribute('value') || opt.dataset.value || opt.textContent.trim(),
      label: opt.textContent.trim()
    }));

    if (mode === 'dropdown') {
      this.innerHTML = `
        <select class="aufbau-switch-select">
          ${options.map(opt => `
            <option value="${opt.value}" ${opt.value === currentValue ? 'selected' : ''}>
              ${opt.label}
            </option>
          `).join('')}
        </select>
      `;
    } else {
      this.innerHTML = `
        <div class="aufbau-switch-group" role="radiogroup">
          ${options.map(opt => `
            <button 
              type="button" 
              data-value="${opt.value}" 
              class="switch-btn ${opt.value === currentValue ? 'is-selected' : ''}"
            >
              ${opt.label}
            </button>
          `).join('')}
        </div>
      `;
    }
  }
}

AufbauSwitch.init();
