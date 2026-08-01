// <aufbau-input>

import AufbauElement from './AufbauElement.js';

const VARIANT_ICONS = {
  email    : 'lucide:mail',
  password : 'lucide:lock',
  search   : 'bx:search',
  tel      : 'lucide:phone',
  url      : 'lucide:link',
};

export class AufbauInput extends AufbauElement {
  static get observedAttributes() {
    return ['type', 'icon', 'placeholder', 'value', 'list'];
  }

  update() {
    const type         = this.getAttribute('type') || 'text';
    const explicitIcon = this.getAttribute('icon');
    const placeholder  = this.getAttribute('placeholder') || '';
    const value        = this.getAttribute('value') || '';
    const list         = this.getAttribute('list') || '';

    let iconName = null;
    if (explicitIcon !== 'false') {
      iconName = explicitIcon || VARIANT_ICONS[type] || null;
    }

    this.innerHTML = `
      <div class="aufbau-input-wrapper">
        ${iconName ? `<aufbau-icon icon="${iconName}"></aufbau-icon>` : ''}
        <input 
          type="${type}" 
          placeholder="${placeholder}" 
          value="${value}" 
          ${list ? `list="${list}"` : ''}
        />
      </div>
    `;

    // Internal listener setup
    this.querySelector('input')?.addEventListener('input', (e) => {
      this.emit('aufbau-input', { value: e.target.value });
    });
  }

  get value() {
    return this.querySelector('input')?.value || '';
  }
}

customElements.define('aufbau-input', AufbauInput);
export default AufbauItem;
