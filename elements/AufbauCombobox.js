// <aufbau-combobox>

import AufbauElement from './AufbauElement.js';
import importFile     from '@aufbau/import';

export class AufbauCombobox extends AufbauElement {
  static get observedAttributes () {
    return ['placeholder', 'value', 'src', 'disabled'];
  }

  onMount () {
    this.on('input', (e) => {
      if (!e.target.matches('.combobox-input')) return;
      this.filterOptions(e.target.value);
      this.emit('aufbau-combobox', { value: e.target.value });
    });

    this.on('click', (e) => {
      const item = e.target.closest('.combobox-option');
      if (!item) return;

      const value = item.dataset.value;
      this.setAttributes({ value });
      this.closeDropdown();
      this.emit('aufbau-combobox', { value });
    });

    // close dropdown on outside click — unsubscribed again in onUnmount
    const handleOutsideClick = (e) => { if (!this.contains(e.target)) this.closeDropdown(); };
    document.addEventListener('click', handleOutsideClick);
    this._offOutsideClick = () => document.removeEventListener('click', handleOutsideClick);
  }

  onUnmount () {
    this._offOutsideClick?.();
  }

  async update () {
    const { placeholder = 'Select or type...', value = '' } = this.getAttributes();
    const src = this.attr('src');
    const isDisabled = this.hasAttribute('disabled');

    if (src && !this._optionsData) {
      try {
        this._optionsData = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-combobox] Failed to load options from "${src}":`, err);
        this._optionsData = [];
      }
    }

    const inlineOptions = this.$$('option').map(opt => ({
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
            ${isDisabled ? 'disabled' : ''}
          />
          <aufbau-icon icon="lucide:chevron-down" class="dropdown-icon"></aufbau-icon>
        </div>
        <div class="combobox-list" hidden>
          ${options.map(opt => {
            const val   = typeof opt === 'object' ? (opt.value || opt.name) : opt;
            const label = typeof opt === 'object' ? (opt.label || opt.name || val) : opt;
            return `<div class="combobox-option" data-value="${val}">${label}</div>`;
          }).join('')}
        </div>
      </div>
    `;

    this.$('.combobox-input')?.on('focus', () => this.openDropdown());
  }

  openDropdown () {
    const list = this.$('.combobox-list');
    if (list) list.hidden = false;
  }

  closeDropdown () {
    const list = this.$('.combobox-list');
    if (list) list.hidden = true;
  }

  filterOptions (query) {
    const q = query.toLowerCase().trim();
    this.$$('.combobox-option').forEach(opt => {
      opt.hidden = !opt.textContent.toLowerCase().includes(q);
    });
    this.openDropdown();
  }
}

if (!customElements.get('aufbau-combobox')) customElements.define('aufbau-combobox', AufbauCombobox);
export default AufbauCombobox;
