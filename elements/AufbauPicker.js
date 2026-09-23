// <aufbau-picker>

/*
one-of-n (or n-of-n with `multiple`).
the look attribute only changes the presentation, never the markup contract:
the same <aufbau-option> children work as combobox, radio group or segmented control.
*/

import { importFile } from '@aufbau/import';
import { isArray, isFn, isString } from '@pulgasari/is';

import filterElements from '@domina/methods/filterElements.js';
import setAttr        from '@domina/methods/setAttr.js';
import setValue       from '@domina/methods/setValue.js';

import { AufbauControl, normalizeOptions, observeOptions, readOptions } from './core/index.js';
import { attrs, html } from './core/html.js';

export default class AufbauPicker extends AufbauControl {
  static attr = {
    look        : { type: String, default: 'combobox', values: ['combobox', 'cycle', 'radio', 'segments'] },
    multiple    : Boolean,
    placeholder : 'select…',
    searchable  : Boolean,
    src         : String,
  };
  
  static styles = `aufbau-picker { 
    position: relative;

    .ui {
      position    : relative;
      display     : block;
      inline-size : 100%;
    }
    
    .field {
      align-items : center;
      cursor      : pointer;
      display     : flex;
      gap         : 0.5rem;
      inline-size : 100%;
      min-inline-size : 0;
    }

    .input {
      background    : none;
      flex          : 1 1 auto;
      text-overflow : ellipsis;
      
      border  : 0;
      margin  : 0;
      padding : 0;
      min-inline-size: 0;
      
      color  : inherit;
      cursor : inherit;
      font   : inherit;

      :focus { outline: none; }
    }

    .caret {
      flex       : none;
      transition : rotate 0.15s ease;
    }

    &.is-open .caret { rotate: 180deg; }

    /* top-layer overlay setup via fixed positioning */
    .list {
      position: fixed;
      z-index: var(--aufbau-overlay-z, 20);
      max-block-size: var(--picker-list-size, 15em);
      overflow-y: auto;
      overscroll-behavior: contain;
      margin     : 0;
      padding    : 0;
      border     : none;
      background : var(--bg, Canvas);
      color      : var(--fg, CanvasText);


      &:popover-open { display: block; }
    }

    .option {
      display     : flex;
      align-items : center;
      gap         : 0.5rem;
      inline-size : 100%;
      margin      : 0;
      border      : 0;
      background  : none;
      color       : inherit;
      font        : inherit;
      text-align  : start;
      cursor      : pointer;

      &[aria-disabled="true"],
      &:disabled { cursor: not-allowed; opacity: 0.5; }
    }

    .label {
      flex: 1 1 auto;
      min-inline-size: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .group {
      display: flex;
      gap: var(--aufbau-control-gap, 0.5em);
      flex-wrap: wrap;
    }

    /* radio stacks and keeps its marks, segments sit in one seamless row */
    .radio { 
      flex-direction: column;

      .mark {
        flex        : none;
        inline-size : 0.85em;
        block-size  : 0.85em;
      }
    }
    
    /* look: combobox */

    /* look: cycle */

    /* look: radio */

    /* look: segments */

    .segments {
      flex-wrap: nowrap;
      gap: 0;

      .option { justify-content: center; }
      .mark   { display: none; }
      .label  { flex: 0 1 auto; }
    }
    
    .is-hidden { display: none; }
  }`;

  // options live in the light dom, the ui gets its own shell next to them
  get renderTarget () { return this.shell('ui'); }

  get options () {
    return [...readOptions(this, { ignore: this.renderTarget }), ...(this._remoteOptions ?? [])];
  }

  get isOpen () {
    const list = this.$('.picker-list');
    if (!list) return false;
    // when the popover api is in play it is the single source of truth — the
    // `hidden` attribute is only ever written on the fallback path in setOpen().
    // reading `|| !list.hidden` here reported a freshly rendered (closed) list as
    // open, because `hidden` starts out false, so the first toggle() closed it.
    if (typeof list.showPopover === 'function' && list.popover) return list.matches(':popover-open');
    return !list.hidden;
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
    if (!name)          return values.join(',');

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

    this.on('click', '.option', (event, item) => this.select(item.dataset.value));
    this.on('click', '.field',  () => this.toggle());

    this.on('input', '.input', (event, input) => {
      this.open();
      this.filter(input.value);
    });

    this.on('keydown', (event) => this.onKeydown(event));
    this.onOutside(() => this.close());

    // recalculate popover coordinates on scroll or viewport resize. routed
    // through this.on() so release() tears them down on disconnect — a raw
    // window.addEventListener here leaked two listeners per mount
    const handleReposition = () => { if (this.isOpen) this.updatePlacement(); };
    this.on(window, 'resize', handleReposition, { passive: true });
    this.on(window, 'scroll', handleReposition, { capture: true, passive: true });

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
    const list = this.$('.list');
    if (!list || this.isDisabled) return;

    if (open) {
      if (list.showPopover && !list.matches(':popover-open')) {
        list.showPopover();
      } else {
        setAttr(list, { hidden: false });
      }
      this.updatePlacement();
    } else {
      if (list.hidePopover && list.matches(':popover-open')) {
        list.hidePopover();
      } else {
        setAttr(list, { hidden: true });
      }
    }

    setAttr(this.$('.picker-field'), { ariaExpanded: String(open) });
    this.classList.toggle('is-open', open);
  }

  /** computes top-layer placement and auto-flips above trigger when space is constrained */
  updatePlacement () {
    const list  = this.$('.list');
    const field = this.$('.field');
    if (!list || !field || !this.isOpen) return;

    const rect                = field.getBoundingClientRect();
    const viewportHeight      = window.innerHeight;
    const estimatedMenuHeight = Math.min(list.scrollHeight || 240, 240);

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeTop   = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

    this.dataset.placement = placeTop ? 'top' : 'bottom';

    // align width and position relative to trigger field in viewport space
    list.style.inlineSize = `${rect.width}px`;
    list.style.left       = `${rect.left}px`;

    if (placeTop) {
      list.style.top          = 'auto';
      list.style.bottom       = `${viewportHeight - rect.top + 4}px`;
      list.style.maxBlockSize = `${Math.min(spaceAbove - 12, 240)}px`;
    } else {
      list.style.bottom       = 'auto';
      list.style.top          = `${rect.bottom + 4}px`;
      list.style.maxBlockSize = `${Math.min(spaceBelow - 12, 240)}px`;
    }
  }

  filter (query) {
    filterElements({
      container     : this.$('.list'),
      item          : '.option',
      filters       : [['', query, 'contains']],
      mismatchClass : 'is-hidden',
    });
    this.updatePlacement();
  }

  onKeydown (event) {
    const { key } = event;

    if (key === 'Escape' && this.isOpen) { event.preventDefault(); this.close(); return; }

    const items = this.$$('.option:not(.is-hidden):not([disabled])');
    if (!items.length) return;

    if (key === 'Enter' || key === ' ') {
      const target = event.target.closest?.('.option');
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

    const current = items.indexOf(event.target.closest?.('.option'));
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
        <div class='field' role='combobox' aria-haspopup='listbox' aria-expanded='false'>
          <input type='text' ${attrs({ placeholder, readonly: !searchable })} />
          <aufbau-icon icon="lucide:chevron-down" class='caret'></aufbau-icon>
        </div>
        <div class='list' popover='manual' role='listbox' ${attrs({ 'aria-multiselectable': multiple })}>
          ${options.map(entry => html`
            <div class='option' role='option' data-value="${entry.value}" tabindex='-1' ${attrs({ 'aria-disabled': entry.disabled })}>
              ${entry.icon && html`<aufbau-icon icon='${entry.icon}'></aufbau-icon>`}
              <span class='label'>${entry.label}</span>
            </div>
          `)}
        </div>
      `;
    }

    // radio and segments share the markup, they differ only in styling
    return html`
      <div class='group ${look}' role='${multiple ? 'group' : 'radiogroup'}'>
        ${options.map(entry => html`
          <button
            type='button' 
            class='option' 
            role='${multiple ? 'checkbox' : 'radio'}'
            data-value='${entry.value}' 
            tabindex='-1' 
            aria-checked='false' 
            ${attrs({ disabled: entry.disabled })}
          >
            <span class='mark'></span>
            ${entry.icon && html`<aufbau-icon icon='${entry.icon}'></aufbau-icon>`}
            <span class='label'>${entry.label}</span>
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
      setValue(input, labels.join(', '));
    }
  }
}

AufbauPicker.init();
