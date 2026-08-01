// <aufbau-number>

import AufbauElement from './AufbauElement.js';

export class AufbauNumber extends AufbauElement {
  static get observedAttributes() {
    return ['value', 'min', 'max', 'step', 'disabled', 'unit'];
  }

  onMount() {
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-step]');
      if (!btn || this.hasAttribute('disabled')) return;
      
      const direction = parseInt(btn.dataset.step, 10);
      this.stepBy(direction);
    });

    this.addEventListener('change', (e) => {
      if (e.target.matches('.number-input')) {
        this.setValue(e.target.value);
      }
    });
  }

  stepBy(direction) {
    const step    = parseFloat(this.getAttribute('step') || '1');
    const current = parseFloat(this.getAttribute('value') || '0');
    this.setValue(current + direction * step);
  }

  setValue(val) {
    const min = this.hasAttribute('min') ? parseFloat(this.getAttribute('min')) : -Infinity;
    const max = this.hasAttribute('max') ? parseFloat(this.getAttribute('max')) : Infinity;
    
    let clamped = Math.max(min, Math.min(max, parseFloat(val) || 0));
    this.setAttribute('value', clamped.toString());
    this.emit('aufbau-number', { value: clamped });
  }

  update() {
    const max   = this.getAttribute('max');
    const min   = this.getAttribute('min');
    const step  = this.getAttribute('step')  || '1';
    const unit  = this.getAttribute('unit')  || '';
    const value = this.getAttribute('value') || '0';
    const isDisabled = this.hasAttribute('disabled');

    this.innerHTML = `
      <div class="aufbau-number-wrapper ${isDisabled ? 'is-disabled' : ''}">
        <button type="button" class="btn-step btn-dec" data-step="-1" ${isDisabled ? 'disabled' : ''}>
          <aufbau-icon icon="lucide:minus"></aufbau-icon>
        </button>
        <div class="input-unit-group">
          <input 
            type="number" 
            class="number-input" 
            value="${value}" 
            ${min !== null ? `min="${min}"` : ''} 
            ${max !== null ? `max="${max}"` : ''} 
            step="${step}"
            ${isDisabled ? 'disabled' : ''}
          />
          ${unit ? `<span class="number-unit">${unit}</span>` : ''}
        </div>
        <button type="button" class="btn-step btn-inc" data-step="1" ${isDisabled ? 'disabled' : ''}>
          <aufbau-icon icon="lucide:plus"></aufbau-icon>
        </button>
      </div>
    `;
  }
}

customElements.define('aufbau-number', AufbauNumber);
export default AufbauNumber;
