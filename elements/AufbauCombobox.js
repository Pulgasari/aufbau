// <aufbau-combobox>

import { AufbauElement } from './core/index.js';
import { importFile }    from '@aufbau/import';
import * as dom from '@domina/core';
import { html } from '@aufbau/js';

export default class AufbauCombobox extends AufbauElement {
  static attr = {
    placeholder : 'select or type...',
    value       : '',
    src         : String,
    disabled    : Boolean
  };

  onMount () {
    // inline <option> children are the data source and get wiped by the first
    // render, so they have to be collected before update() runs
    this._inlineOptions = this.$$('option').map(opt => ({
      value : opt.getAttribute('value') || opt.textContent.trim(),
      label : opt.textContent.trim()
    }));

    this.on('input', '.combobox-input', (e, input) => {
      this.openDropdown();
      this.filterOptions(input.value);
      this.emit('aufbau-combobox', { value: input.value });
    });

    this.on('click', '.combobox-option', (e, item) => {
      const value = item.dataset.value;
      this.setAttr({ value });
      this.closeDropdown();
      this.emit('aufbau-combobox', { value });
    });

    this.on('click', '.input-container', () => this.toggleDropdown());

    this.onOutside(() => this.closeDropdown());
  }

  get options () { return this._remoteOptions ?? this._inlineOptions ?? []; }

  openDropdown  () { dom.setAttr(this.$('.combobox-list'), { hidden: false }); }
  closeDropdown () { dom.setAttr(this.$('.combobox-list'), { hidden: true  }); }

  toggleDropdown () {
    const list = this.$('.combobox-list');
    if (list) dom.setAttr(list, { hidden: !list.hidden });
  }

  filterOptions (query) {
    dom.filterElements({
      container     : this.$('.combobox-list'),
      item          : '.combobox-option',
      filters       : [['', query, 'contains']],
      mismatchClass : 'is-hidden'
    });
  }

  async update () {
    const { src } = this.getAttr();

    if (src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      try {
        const data = await importFile(src);
        this._remoteOptions = this.normalize(data);
      } catch (err) {
        console.warn(`[aufbau-combobox] failed to load options from "${src}":`, err);
        this._remoteOptions = [];
      }
    }

    super.update();
  }

  normalize (data) {
    const list = Array.isArray(data) ? data : Object.values(data ?? {});
    return list.map(opt => typeof opt === 'object' && opt !== null
      ? { value: opt.value ?? opt.name ?? '', label: opt.label ?? opt.name ?? opt.value ?? '' }
      : { value: opt, label: opt });
  }

  render () {
    const { placeholder } = this.getAttr();

    return html`
      <div class="aufbau-combobox-wrapper">
        <div class="input-container">
          <input type="text" class="combobox-input" placeholder="${placeholder}" />
          <aufbau-icon icon="lucide:chevron-down" class="dropdown-icon"></aufbau-icon>
        </div>
        <div class="combobox-list" hidden>
          ${this.options.map(opt => html`
            <div class="combobox-option" data-value="${opt.value}">${opt.label}</div>
          `)}
        </div>
      </div>
    `;
  }

  sync () {
    const { value, disabled } = this.getAttr();
    const input = this.$('.combobox-input');
    if (!input) return;

    dom.setAttr(input, { disabled });
    if (input !== document.activeElement) dom.setValue(input, value);

    for (const opt of this.$$('.combobox-option')) {
      opt.classList.toggle('is-selected', opt.dataset.value === value);
    }
  }
}

AufbauCombobox.init();
