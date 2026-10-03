// @aufbau/webcomponents/input.js

const VARIANT_ICONS = {
  email: 'lucide:mail',
  password: 'lucide:lock',
  search: 'lucide:search',
  url: 'lucide:link',
  tel: 'lucide:phone',
};

class AufbauInput extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'icon', 'placeholder', 'value', 'list'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const type = this.getAttribute('type') || 'text';
    const explicitIcon = this.getAttribute('icon');
    const placeholder = this.getAttribute('placeholder') || '';
    const value = this.getAttribute('value') || '';
    const list = this.getAttribute('list') || '';

    // Determine icon: explicit icon > preset icon (unless icon="false")
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

    // Forward input events out of the web component
    const inputEl = this.querySelector('input');
    inputEl.addEventListener('input', (e) => {
      this.dispatchEvent(new CustomEvent('aufbau-input', { 
        detail: { value: e.target.value },
        bubbles: true 
      }));
    });
  }

  get value() {
    return this.querySelector('input')?.value || '';
  }
}

if (typeof window !== 'undefined' && !customElements.get('aufbau-input')) {
  customElements.define('aufbau-input', AufbauInput);
}
