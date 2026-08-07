// <aufbau-picker>
// one-of-n (or n-of-n with `multiple`). the look attribute only changes the
// presentation, never the markup contract: the same <aufbau-option> children
// work as combobox, radio group or segmented control.

import { AufbauControl, normalizeOptions, observeOptions, readOptions } from './core/index.js';
import { importFile } from '@aufbau/import';
import { attrs, html, isArray } from '@aufbau/js';
import * as dom from '@domina/core';

export default class AufbauPicker extends AufbauControl {
  static attr = {
    look        : { type: String, default: 'combobox', values: ['combobox', 'radio', 'segments'] },
    multiple    : Boolean,
    placeholder : 'select…',
    searchable  : Boolean,
    src         : String,
  };

  // options live in the light dom, the ui gets its own shell next to them
  get renderTarget () { return this.shell('aufbau-picker-ui'); }

  get options () {
    return [...readOptions(this, { ignore: this.renderTarget }), ...(this._remoteOptions ?? [])];
  }

  get isOpen () { return !this.$('.picker-list')?.hidden; }

  // :::::: VALUE :::::::::::::::::::::::::::::::::::::::::::::::

  parseValue (raw) {
    const text = raw == null ? '' : String(raw);
    if (!this.getAttr('multiple')) return text;
    return text ? text.split(',') : [];
  }

  formatValue (value) {
    if (isArray(value)) return value.join(',');
    return value == null ? '' : String(value);
  }

  /** multiple selections submit one FormData entry per value, like a native multi select */
  get formValue () {
    const { multiple, name } = this.getAttr();
    if (!multiple) return super.formValue;

    const values = this.value;
    if (!values.length) return null;
    if (!name) return values.join(',');

    const data = new FormData;
    for (const value of values) data.append(name, value);
    return data;
  }

  get selected () {
    const value = this.value;
    return new Set(isArray(value) ? value : (value ? [value] : []));
  }

  select (value) {
    if (this.isDisabled || this.getAttr('readonly')) return this;

    if (!this.getAttr('multiple')) {
      this.commit(value);
      this.close();
      return this;
    }

    const next = this.selected;
    if (next.has(value)) next.delete(value); else next.add(value);
    this.commit([...next]);
    return this;
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  onMount () {
    // touch the shell first, the observer needs it to ignore our own repaints
    const shell = this.renderTarget;
    this.track(observeOptions(this, () => this.update(), { ignore: shell }));

    this.on('click', '.picker-option', (event, item) => this.select(item.dataset.value));
    this.on('click', '.picker-field',  () => this.toggle());

    this.on('input', '.picker-input', (event, input) => {
      this.open();
      this.filter(input.value);
    });

    this.on('keydown', (event) => this.onKeydown(event));
    this.onOutside(() => this.close());

    // initial selection may come from <aufbau-option selected>. it is the
    // default too, otherwise form.reset() would clear a preselected picker
    if (!this.hasAttribute('value')) {
      const preselected = this.options.filter(option => option.selected).map(option => option.value);
      if (preselected.length) {
        this.commit(this.getAttr('multiple') ? preselected : preselected[0], { notify: false });
        this._defaultValue = this.getAttribute('value') ?? '';
      }
    }
  }

  async update () {
    const { src } = this.getAttr();

    if (src && src !== this._loadedSrc) {
      this._loadedSrc = src;
      try {
        this._remoteOptions = normalizeOptions(await importFile(src));
      } catch (error) {
        console.warn(`[aufbau-picker] could not load options from "${src}":`, error);
        this._remoteOptions = [];
      }
    }

    return super.update();
  }

  // :::::: INTERACTION :::::::::::::::::::::::::::::::::::::::::

  open   () { this.setOpen(true);         return this; }
  close  () { this.setOpen(false);        return this; }
  toggle () { this.setOpen(!this.isOpen); return this; }

  setOpen (open) {
    const list = this.$('.picker-list');
    if (!list || this.isDisabled) return;

    dom.setAttr(list, { hidden: !open });
    dom.setAttr(this.$('.picker-field'), { ariaExpanded: String(open) });
    this.classList.toggle('is-open', open);
  }

  filter (query) {
    dom.filterElements({
      container     : this.$('.picker-list'),
      item          : '.picker-option',
      filters       : [['', query, 'contains']],
      mismatchClass : 'is-hidden',
    });
  }

  onKeydown (event) {
    const { key } = event;

    if (key === 'Escape' && this.isOpen) { event.preventDefault(); this.close(); return; }

    const items = this.$$('.picker-option:not(.is-hidden):not([disabled])');
    if (!items.length) return;

    if (key === 'Enter' || key === ' ') {
      const target = event.target.closest?.('.picker-option');
      if (!target) return;
      event.preventDefault();
      this.select(target.dataset.value);
      return;
    }

    const step = key === 'ArrowDown' || key === 'ArrowRight' ?  1
               : key === 'ArrowUp'   || key === 'ArrowLeft'  ? -1
               : 0;

    if (!step && key !== 'Home' && key !== 'End') return;
    event.preventDefault();
    if (!this.isOpen && this.getAttr('look') === 'combobox') return this.open();

    const current = items.indexOf(event.target.closest?.('.picker-option'));
    const next    = key === 'Home' ? 0
                  : key === 'End'  ? items.length - 1
                  : (current + step + items.length) % items.length;

    items[next].focus();
  }

  // :::::: RENDER ::::::::::::::::::::::::::::::::::::::::::::::

  /** structure only, selection state is applied in sync() */
  render () {
    const { look, multiple, placeholder, searchable } = this.getAttr();
    const options = this.options;

    if (look === 'combobox') {
      return html`
        <div class="picker-field" role="combobox" aria-haspopup="listbox" aria-expanded="false">
          <input class="picker-input" type="text" ${attrs({ placeholder, readonly: !searchable })} />
          <aufbau-icon icon="lucide:chevron-down" class="picker-caret"></aufbau-icon>
        </div>
        <div class="picker-list" role="listbox" ${attrs({ 'aria-multiselectable': multiple })} hidden>
          ${options.map(entry => html`
            <div class="picker-option" role="option" data-value="${entry.value}" tabindex="-1" ${attrs({ 'aria-disabled': entry.disabled })}>
              ${entry.icon && html`<aufbau-icon icon="${entry.icon}"></aufbau-icon>`}
              <span class="picker-label">${entry.label}</span>
            </div>
          `)}
        </div>
      `;
    }

    // radio and segments share the markup, they differ only in styling
    return html`
      <div class="picker-group picker-${look}" role="${multiple ? 'group' : 'radiogroup'}">
        ${options.map(entry => html`
          <button type="button" class="picker-option" role="${multiple ? 'checkbox' : 'radio'}"
                  data-value="${entry.value}" tabindex="-1" aria-checked="false" ${attrs({ disabled: entry.disabled })}>
            <span class="picker-mark"></span>
            ${entry.icon && html`<aufbau-icon icon="${entry.icon}"></aufbau-icon>`}
            <span class="picker-label">${entry.label}</span>
          </button>
        `)}
      </div>
    `;
  }

  sync () {
    super.sync();

    const selected = this.selected;
    const items    = this.$$('.picker-option');

    for (const item of items) {
      const active = selected.has(item.dataset.value);
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-checked', String(active));
      if (item.getAttribute('role') === 'option') item.setAttribute('aria-selected', String(active));
    }

    // roving tabindex: exactly one stop per group, the selected one when there is one
    const stop = items.find(item => selected.has(item.dataset.value)) ?? items[0];
    for (const item of items) item.tabIndex = item === stop ? 0 : -1;

    const input = this.$('.picker-input');
    if (input && input !== document.activeElement) {
      const labels = this.options.filter(entry => selected.has(entry.value)).map(entry => entry.label);
      dom.setValue(input, labels.join(', '));
    }
  }
}

AufbauPicker.init();
