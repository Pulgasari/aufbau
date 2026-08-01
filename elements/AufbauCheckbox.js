// <aufbau-checkbox>

import AufbauElement from './AufbauElement.js';

export class AufbauCheckbox extends AufbauElement {
  static get observedAttributes() {
    return ['checked', 'disabled', 'label', 'value', 'indeterminate'];
  }

  onMount() {
    this.addEventListener('click', this.toggle.bind(this));
  }

  toggle() {
    if (this.hasAttribute('disabled')) return;
    const isChecked = this.hasAttribute('checked');
    
    if (isChecked) {
      this.removeAttribute('checked');
    } else {
      this.setAttribute('checked', '');
    }

    this.emit('aufbau-checkbox', { 
      checked: !isChecked, 
      value: this.getAttribute('value') || 'on' 
    });
  }

  update() {
    const isChecked = this.hasAttribute('checked');
    const isDisabled = this.hasAttribute('disabled');
    const isIndeterminate = this.hasAttribute('indeterminate');
    const label = this.getAttribute('label') || '';

    let stateAttr = isChecked ? 'true' : 'false';
    if (isIndeterminate) stateAttr = 'mixed';

    this.innerHTML = `
      <label class="aufbau-checkbox-wrapper ${isDisabled ? 'is-disabled' : ''}">
        <button 
          type="button" 
          role="checkbox" 
          aria-checked="${stateAttr}" 
          class="checkbox-box ${isChecked ? 'is-checked' : ''} ${isIndeterminate ? 'is-indeterminate' : ''}"
          ${isDisabled ? 'disabled' : ''}
        >
          <aufbau-icon icon="${isIndeterminate ? 'lucide:minus' : 'lucide:check'}"></aufbau-icon>
        </button>
        ${label ? `<span class="checkbox-label">${label}</span>` : ''}
      </label>
    `;
  }
}

customElements.define('aufbau-checkbox', AufbauCheckbox);
export default AufbauCheckbox;
