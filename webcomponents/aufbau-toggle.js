import { AufbauElement } from './AufbauElement.js';

export class AufbauToggle extends AufbauElement {
  static get observedAttributes() {
    return ['checked', 'disabled', 'label'];
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

    // Emit custom event
    this.emit('aufbau-toggle', { checked: !isChecked });
  }

  update() {
    const isChecked = this.hasAttribute('checked');
    const label = this.getAttribute('label') || '';

    this.innerHTML = `
      <button 
        type="button" 
        role="switch" 
        aria-checked="${isChecked}" 
        class="aufbau-toggle-btn ${isChecked ? 'is-active' : ''}"
        ${this.hasAttribute('disabled') ? 'disabled' : ''}
      >
        <span class="thumb"></span>
      </button>
      ${label ? `<span class="toggle-label">${label}</span>` : ''}
    `;
  }
}

customElements.define('aufbau-toggle', AufbauToggle);
