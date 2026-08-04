// <aufbau-combobox>

import { AufbauElement } from './core/AufbauCore.js';
import importFile        from '@aufbau/import';

export default class AufbauCombobox extends AufbauElement {
  
  static attr = {
    placeholder : 'select or type...',
    value       : '', 
    src         : '', 
    disabled    : false
  };

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
      this.setAttr({ value });
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
    const { disabled, src, placeholder, value } = this.getAttr();
    
    if (src && !this._optionsData) {
      try {
        this._optionsData = await importFile(src);
      } catch (err) {
        console.warn(`[aufbau-combobox] Failed to load options from "${src}":`, err);
        this._optionsData = [];
      }
    }

    const inlineOptions = this.$$('option').map(opt => ({
      value: opt.getAttr('value') || opt.textContent.trim(),
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
            ${disabled ? 'disabled' : ''}
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

  openDropdown  () { this.$('.combobox-list')?.hidden = false; }
  closeDropdown () { this.$('.combobox-list')?.hidden = true;  }

  filterOptions (query) {
    const q = query.toLowerCase().trim();
    this.$$('.combobox-option').forEach(opt => {
      opt.hidden = !opt.textContent.toLowerCase().includes(q);
    });
    this.openDropdown();
  }
}

AufbauCombobox.init();
