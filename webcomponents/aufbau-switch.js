import { AufbauElement } from './AufbauElement.js';

export class AufbauSwitch extends AufbauElement {
  static get observedAttributes() {
    return ['value', 'mode'];
  }

  onMount() {
    // Handle click events on segmented buttons
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-value]');
      if (btn) {
        const val = btn.dataset.value;
        this.setAttribute('value', val);
        this.emit('aufbau-switch', { value: val });
      }
    });
  }

  update() {
    const currentValue = this.getAttribute('value');
    const mode = this.getAttribute('mode') || 'buttons'; // 'buttons' | 'dropdown'

    // Extract options from child <option> tags
    const optionElements = Array.from(this.querySelectorAll('option, [data-value]'));
    const options = optionElements.map(opt => ({
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

      this.querySelector('select')?.addEventListener('change', (e) => {
        this.setAttribute('value', e.target.value);
        this.emit('aufbau-switch', { value: e.target.value });
      });
    } else {
      // Default: Segmented control buttons
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

customElements.define('aufbau-switch', AufbauSwitch);
