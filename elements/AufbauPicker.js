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

  // the list overlays the page instead of pushing it apart, so the ui shell is
  // the positioning context. everything decorative lives in the skin
  static styles = `
    aufbau-picker { position: relative; }

    aufbau-picker .aufbau-picker-ui {
      position: relative;
      display: block;
      inline-size: 100%;
    }

    aufbau-picker .picker-field {
      display: flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
      inline-size: 100%;
      min-inline-size: 0;
      cursor: pointer;
    }

    aufbau-picker .picker-input {
      flex: 1 1 auto;
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: inherit;
      text-overflow: ellipsis;
    }

    aufbau-picker .picker-input:focus { outline: none; }

    aufbau-picker .picker-caret {
      flex: none;
      transition: rotate 0.15s ease;
    }

    aufbau-picker.is-open .picker-caret { rotate: 180deg; }

    /* top-layer overlay setup via fixed positioning */
    aufbau-picker .picker-list {
      position: fixed;
      z-index: var(--aufbau-overlay-z, 20);
      max-block-size: var(--picker-list-size, 15em);
      overflow-y: auto;
      overscroll-behavior: contain;
      margin: 0;
      padding: 0;
      border: none;
      background: none;
      color: inherit;
    }

    aufbau-picker .picker-list:popover-open {
      display: block;
    }

    aufbau-picker .picker-option {
      display: flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
      inline-size: 100%;
      margin: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      text-align: start;
      cursor: pointer;
    }

    aufbau-picker .picker-option[aria-disabled="true"],
    aufbau-picker .picker-option:disabled { cursor: not-allowed; opacity: 0.5; }

    aufbau-picker .picker-label {
      flex: 1 1 auto;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    aufbau-picker .picker-group {
      display: flex;
      gap: var(--aufbau-control-gap, 0.5em);
      flex-wrap: wrap;
    }

    /* radio stacks and keeps its marks, segments sit in one seamless row */
    aufbau-picker .picker-radio { flex-direction: column; }

    aufbau-picker .picker-radio .picker-mark {
      flex: none;
      inline-size: 0.85em;
      block-size: 0.85em;
    }

    aufbau-picker .picker-segments {
      flex-wrap: nowrap;
      gap: 0;
    }

    aufbau-picker .picker-segments .picker-option { justify-content: center; }
    aufbau-picker .picker-segments .picker-mark   { display: none; }
    aufbau-picker .picker-segments .picker-label  { flex: 0 1 auto; }

    /* filterElements() marks non matching entries with this, see filter() below.
       last on purpose: same specificity as the .picker-option rules above, so it
       has to come after them to win */
    aufbau-picker .is-hidden { display: none; }
  `;

  // options live in the light dom, the ui gets its own shell next to them
  get renderTarget () { return this.shell('aufbau-picker-ui'); }

  get options () {
    return [...readOptions(this, { ignore: this.renderTarget }), ...(this._remoteOptions ?? [])];
  }

  get isOpen () {
    const list = this.$('.picker-list');
    if (!list) return false;
    return list.matches?.(':popover-open') || !list.hidden;
  }

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

    // recalculate popover coordinates on scroll or viewport resize
    const handleReposition = () => { if (this.isOpen) this.updatePlacement(); };
    window.addEventListener('resize', handleReposition, { passive: true });
    window.addEventListener('scroll', handleReposition, { capture: true, passive: true });

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

    if (open) {
      if (list.showPopover && !list.matches(':popover-open')) {
        list.showPopover();
      } else {
        dom.setAttr(list, { hidden: false });
      }
      this.updatePlacement();
    } else {
      if (list.hidePopover && list.matches(':popover-open')) {
        list.hidePopover();
      } else {
        dom.setAttr(list, { hidden: true });
      }
    }

    dom.setAttr(this.$('.picker-field'), { ariaExpanded: String(open) });
    this.classList.toggle('is-open', open);
  }

  /** computes top-layer placement and auto-flips above trigger when space is constrained */
  updatePlacement () {
    const list = this.$('.picker-list');
    const field = this.$('.picker-field');
    if (!list || !field || !this.isOpen) return;

    const rect = field.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const estimatedMenuHeight = Math.min(list.scrollHeight || 240, 240);

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeTop = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

    this.dataset.placement = placeTop ? 'top' : 'bottom';

    // align width and position relative to trigger field in viewport space
    list.style.inlineSize = `${rect.width}px`;
    list.style.left = `${rect.left}px`;

    if (placeTop) {
      list.style.top = 'auto';
      list.style.bottom = `${viewportHeight - rect.top + 4}px`;
      list.style.maxBlockSize = `${Math.min(spaceAbove - 12, 240)}px`;
    } else {
      list.style.bottom = 'auto';
      list.style.top = `${rect.bottom + 4}px`;
      list.style.maxBlockSize = `${Math.min(spaceBelow - 12, 240)}px`;
    }
  }

  filter (query) {
    dom.filterElements({
      container     : this.$('.picker-list'),
      item          : '.picker-option',
      filters       : [['', query, 'contains']],
      mismatchClass : 'is-hidden',
    });
    this.updatePlacement();
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
        <div class="picker-list" popover="manual" role="listbox" ${attrs({ 'aria-multiselectable': multiple })}>${options.map(entry => html`
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
