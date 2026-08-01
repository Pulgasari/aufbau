// <aufbau-combobox>

import AufbauElement from './AufbauElement.js';
import aufbauImport  from '@aufbau/import';

export class AufbauCombobox extends AufbauElement {
  static get observedAttributes() {
    return ['placeholder', 'value', 'src', 'disabled'];
  }

  onMount() {
    // Listen for input filtering and selection
    this.addEventListener('input', (e) => {
      if (e.target.matches('.combobox-input')) {
        this.filterOptions(e.target.value);
        this.emit('aufbau-combobox', { value: e.target.value });
      }
    });

    this.addEventListener('click', (e) => {
      const item = e.target.closest('.combobox-option');
      if (item) {
        const val = item.dataset.value;
        this.setAttribute('value', val);
        this.closeDropdown();
        this.emit('aufbau-combobox', { value: val });
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) this.closeDropdown();
    });
  }

  async update() {
    const placeholder = this.getAttribute('placeholder') || 'Select or type...';
    const value       = this.getAttribute('value')       || '';
    const src         = this.getAttribute('src');

    // Load remote items via @aufbau/import if src attribute is present
    if (src && !this._optionsData) {
      try {
        this._optionsData = await aufbauImport(src);
      } catch (err) {
        console.warn(`[aufbau-combobox] Failed to load options from "${src}":`, err);
        this._optionsData = [];
      }
    }

    // Extract options from inline <option> elements or _optionsData
    const inlineOptions = Array.from(this.querySelectorAll('option')).map(opt => ({
      value: opt.getAttribute('value') || opt.textContent.trim(),
      label: opt.textContent.trim()
    }));

    const options = this._optionsData || inlineOptions;

    this.innerHTML = `
      <div class="aufbau-combobox-wrapper">
        <div class="input-container">
          <input 
            type="text" 
            class="combobox-input" 
            placeholder="${placeholder}" 
            value="${value}"
            ${this.hasAttribute('disabled') ? 'disabled' : ''}
          />
          <aufbau-icon icon="lucide:chevron-down" class="dropdown-icon"></aufbau-icon>
        </div>
        <div class="combobox-list" hidden>
          ${options.map(opt => {
            const val = typeof opt === 'object' ? opt.value || opt.name : opt;
            const label = typeof opt === 'object' ? opt.label || opt.name || val : opt;
            return `<div class="combobox-option" data-value="${val}">${label}</div>`;
          }).join('')}
        </div>
      </div>
    `;

    const inputEl = this.querySelector('.combobox-input');
    inputEl?.addEventListener('focus', () => this.openDropdown());
  }

  openDropdown() {
    const list = this.querySelector('.combobox-list');
    if (list) list.hidden = false;
  }

  closeDropdown() {
    const list = this.querySelector('.combobox-list');
    if (list) list.hidden = true;
  }

  filterOptions(query) {
    const options = this.querySelectorAll('.combobox-option');
    const q = query.toLowerCase().trim();
    options.forEach(opt => {
      const match = opt.textContent.toLowerCase().includes(q);
      opt.hidden = !match;
    });
    this.openDropdown();
  }
}

customElements.define('aufbau-combobox', AufbauCombobox);
export default AufbauCombobox;
