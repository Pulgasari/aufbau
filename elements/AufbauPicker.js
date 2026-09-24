// <aufbau-picker>

/*
one-of-n (or n-of-n with `multiple`).
the look attribute only changes the presentation, never the data contract:
the same <aufbau-option> children work as combobox, cycle, radio group or segmented control.

looks:
  combobox  the host is the field, a popover list offers the options
  cycle     a single button showing the current option. click takes the next one,
            long press (or context menu) opens the list for a direct pick. always single
  radio     every option inline, stacked, with a mark
  segments  every option inline, one seamless row

`icons-only` hides the labels of inline options and of the cycle button wherever the
option has an icon. the label then becomes the accessible name and the tooltip.
popover lists always show labels.
*/

import { importFile } from '@aufbau/import';
import { isArray }    from '@pulgasari/is';

import setAttr  from '@domina/methods/setAttr.js';
import setValue from '@domina/methods/setValue.js';

import { AufbauControl, normalizeOptions, observeOptions, readOptions } from './core/index.js';
import { attrs, html } from './core/html.js';
import { place }       from './core/placement.js';

const GROUPED    = new Set(['radio', 'segments']);
const POPUP      = new Set(['combobox', 'cycle']);
const LONG_PRESS = 500;

const isInactive = item => item.hidden || item.matches(':disabled, [aria-disabled="true"]');

export default class AufbauPicker extends AufbauControl {
  static reflect = ['look'];

  static attr = {
    iconsOnly   : Boolean,
    look        : { type: String, default: 'combobox', values: ['combobox', 'cycle', 'radio', 'segments'] },
    multiple    : Boolean,
    placeholder : 'select…',
    searchable  : Boolean,
    src         : String,
  };

  // the ui lives in the shadow root, the <aufbau-option> children stay where the
  // author put them and are only read. parts: field, caret, listbox, option,
  // trigger, icon, label. options carry the extra part token `selected`
  static shadow = true;

  static styles = `
    :host {
      align-items : center;
      display     : inline-flex;
      gap         : var(--aufbau-control-gap, 0.5em);
    }

    :is(button, [role="option"]) {
      align-items : center;
      background  : none;
      border      : 0;
      color       : inherit;
      cursor      : pointer;
      display     : flex;
      font        : inherit;
      gap         : 0.5em;
      margin      : 0;
      text-align  : start;

      &:is(:disabled, [aria-disabled="true"]) { cursor: not-allowed; opacity: 0.5; }

      > span {
        flex            : 1 1 auto;
        min-inline-size : 0;
        overflow        : hidden;
        text-overflow   : ellipsis;
        white-space     : nowrap;
      }
    }

    [part~="field"] {
      background      : none;
      border          : 0;
      color           : inherit;
      cursor          : inherit;
      flex            : 1 1 auto;
      font            : inherit;
      margin          : 0;
      min-inline-size : 0;
      padding         : 0;
      text-overflow   : ellipsis;

      &:focus { outline: none; }

      &[aria-expanded="true"] + [part~="caret"] { rotate: 180deg; }
    }

    [part~="caret"] { flex: none; transition: rotate 0.15s ease; }

    /* top layer, positioned by core/placement.js */
    [part~="listbox"] {
      border              : 0;
      color               : inherit;
      margin              : 0;
      max-block-size      : var(--picker-list-size, 15em);
      overflow-y          : auto;
      overscroll-behavior : contain;
      padding             : 0;
      position            : fixed;
      z-index             : var(--aufbau-overlay-z, 20);

      > [part~="option"] { inline-size: 100%; }
    }

    :host([look="combobox"]) { cursor: pointer; }

    :host([look="cycle"]) [part~="trigger"] {
      -webkit-touch-callout : none;
      justify-content       : center;
      user-select           : none;
    }

    :host([look="radio"]) {
      align-items    : flex-start;
      flex-direction : column;
    }

    :host([look="radio"]) :is([role="radio"], [role="checkbox"])::before {
      block-size  : 0.85em;
      content     : '';
      flex        : none;
      inline-size : 0.85em;
    }

    :host([look="segments"]) { gap: 0; }

    :host([look="segments"]) :is([role="radio"], [role="checkbox"]) {
      justify-content: center;
      > span { flex: 0 1 auto; }
    }

    /* the skin sets the line, the element knows where it goes */
    :host([look="segments"]) [part~="option"] + [part~="option"] { border-inline-start: var(--picker-divider, 0); }
  `;


  get options () {
    return [...readOptions(this), ...(this._remoteOptions ?? [])];
  }

  get look       () { return this.getAttr('look'); }
  get isMultiple () { return this.getAttr('multiple') && this.look !== 'cycle'; }

  // rendered parts, all inside the shadow root, authored [data-value] sources never match
  get items   () { return [...this.root.querySelectorAll('[data-value]')]; }
  get listbox () { return this.root.querySelector('[role="listbox"]'); }
  get trigger () { return this.root.querySelector('[aria-haspopup]'); }

  get isOpen () {
    const list = this.listbox;
    if (!list) return false;
    // the popover api is the single source of truth when present, `hidden` is only the fallback
    return list.popover ? list.matches(':popover-open') : !list.hidden;
  }

  // roving stop for grouped looks, the trigger for popup looks
  get focusTarget () {
    return this.root.querySelector('[aria-haspopup], [data-value][tabindex="0"]') ?? super.focusTarget;
  }

  // :::::: VALUE :::::::::::::::::::::::::::::::::::::::::::::::

  parseValue (raw) {
    const text = raw == null ? '' : String(raw);
    if (!this.isMultiple) return text;
    return text ? text.split(',') : [];
  }

  formatValue (value) {
    if (isArray(value)) return value.join(',');
    return value == null ? '' : String(value);
  }

  /** multiple selections submit one FormData entry per value, like a native multi select */
  get formValue () {
    if (!this.isMultiple) return super.formValue;

    const name   = this.getAttr('name');
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

    if (!this.isMultiple) {
      this.commit(value);
      this.close();
      return this;
    }

    const next = this.selected;
    if (next.has(value)) next.delete(value); else next.add(value);
    this.commit([...next]);
    return this;
  }

  /** steps through the enabled options, wrapping around at both ends */
  cycle (step = 1) {
    const options = this.options.filter(option => !option.disabled);
    if (!options.length) return this;

    const index = options.findIndex(option => option.value === this.value);
    const next  = options[(index + step + options.length) % options.length];
    return this.select(next.value);
  }

  // :::::: LIFECYCLE :::::::::::::::::::::::::::::::::::::::::::

  onMount () {

    // the ui is in the shadow root, so the observer only ever sees the author's options
    this.track(observeOptions(this, () => this.update()));

    this.on('click', '[data-value]', (event, item) => {
      if (this.root.contains(item) && !isInactive(item)) this.select(item.dataset.value);
    });

    // clicks from inside arrive retargeted to the host, the composed path still knows where they came from
    this.on('click', (event) => {
      if (this.look !== 'combobox' || event.composedPath().includes(this.listbox)) return;
      this.toggle();
    });

    this.on('click', '[aria-haspopup]', () => {
      if (this.look !== 'cycle') return;
      if (this._longPressed) { this._longPressed = false; return; }
      if (this.isOpen) this.close(); else this.cycle(1);
    });

    this.onLongPress();

    this.on('input', '[role="combobox"]', (event, input) => {
      this.open();
      this.filter(input.value);
    });

    // on the root: keydown targets inside are retargeted to the host once they leave it
    this.on(this.root, 'keydown', (event) => this.onKeydown(event));
    this.onOutside(() => this.close());

    // recalculate popover coordinates on scroll or viewport resize. routed
    // through this.on() so release() tears them down on disconnect
    const handleReposition = () => { if (this.isOpen) this.updatePlacement(); };
    this.on(window, 'resize', handleReposition, { passive: true });
    this.on(window, 'scroll', handleReposition, { capture: true, passive: true });

    // initial selection may come from <aufbau-option selected>. it is the
    // default too, otherwise form.reset() would clear a preselected picker
    if (!this.hasAttribute('value')) {
      const preselected = this.options.filter(option => option.selected).map(option => option.value);
      if (preselected.length) {
        this.commit(this.isMultiple ? preselected : preselected[0], { notify: false });
        this._defaultValue = this.getAttribute('value') ?? '';
      }
    }
  }

  // cycle only: holding the trigger opens the list. the click that ends the
  // press is swallowed, otherwise it would step to the next option as well
  onLongPress () {
    const release = () => {
      clearTimeout(this._pressTimer);
      // the click follows pointerup within the same task, so the flag outlives it by one tick
      if (this._longPressed) setTimeout(() => { this._longPressed = false; });
    };

    this.on('pointerdown', '[aria-haspopup]', (event) => {
      if (this.look !== 'cycle' || event.button !== 0) return;
      this._longPressed = false;
      clearTimeout(this._pressTimer);
      this._pressTimer = setTimeout(() => {
        this._longPressed = true;
        this.open();
      }, LONG_PRESS);
    });

    this.on(window, 'pointerup',     release);
    this.on(window, 'pointercancel', release);
    this.track(() => clearTimeout(this._pressTimer));

    // right click on desktop, and the long press gesture of some touch browsers
    this.on('contextmenu', '[aria-haspopup]', (event) => {
      if (this.look !== 'cycle') return;
      event.preventDefault();
      this.open();
    });
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
    const list = this.listbox;
    if (!list || this.isDisabled || open === this.isOpen) return;

    // read before hiding, a hidden popover has already dropped its focus
    const hadFocus = list.contains(this.focused);

    if (list.popover) list[open ? 'showPopover' : 'hidePopover']();
    else list.hidden = !open;

    this.trigger?.setAttribute('aria-expanded', String(open));

    if (open) return this.updatePlacement();

    // focus must not stay behind in a list that is gone
    if (hadFocus) this.trigger?.focus();
    this.filter('');
  }

  /** moves focus into the open list, onto the selected option when there is one */
  focusList () {
    const items = this.navigable;
    const stop  = items.find(item => this.selected.has(item.dataset.value)) ?? items[0];
    stop?.focus();
  }

  // what arrow keys move through: the open list for popup looks, the inline options otherwise
  get navigable () {
    const scope = POPUP.has(this.look) ? this.listbox : this.root;
    return scope ? [...scope.querySelectorAll('[data-value]')].filter(item => !isInactive(item)) : [];
  }

  /** top layer placement, flips above the anchor when the space below is too small */
  updatePlacement () {
    const list   = this.listbox;
    const anchor = this.look === 'cycle' ? this.trigger : this;
    if (!list || !anchor || !this.isOpen) return;
    this.dataset.placement = place(list, anchor);
  }

  filter (query) {
    const needle = String(query ?? '').trim().toLowerCase();
    for (const item of this.listbox?.querySelectorAll('[role="option"]') ?? []) {
      item.hidden = Boolean(needle) && !item.textContent.toLowerCase().includes(needle);
    }
    this.updatePlacement();
  }

  onKeydown (event) {
    const { key } = event;
    const popup   = POPUP.has(this.look);

    if (key === 'Escape' && this.isOpen) { event.preventDefault(); this.close(); return; }

    // enter/space on a rendered option selects it. the cycle trigger is a native button and clicks by itself
    const item = event.target.closest?.('[data-value]');
    if ((key === 'Enter' || key === ' ') && item && this.root.contains(item)) {
      event.preventDefault();
      this.select(item.dataset.value);
      return;
    }

    // popup looks only take the vertical arrows, left/right belong to the caret of the search field
    const step = key === 'ArrowDown' || (!popup && key === 'ArrowRight') ?  1
               : key === 'ArrowUp'   || (!popup && key === 'ArrowLeft')  ? -1
               : 0;

    if (popup && step && !this.isOpen) {
      event.preventDefault();
      this.open();
      this.focusList();
      return;
    }

    if (!step && key !== 'Home' && key !== 'End') return;
    if (popup && !this.listbox?.contains(event.target)) return;

    const items = this.navigable;
    if (!items.length) return;
    event.preventDefault();

    const current = items.indexOf(item);
    const next    = key === 'Home' ? 0
                  : key === 'End'  ? items.length - 1
                  : (current + step + items.length) % items.length;

    items[next].focus();
  }

  // :::::: RENDER ::::::::::::::::::::::::::::::::::::::::::::::

  /** structure only, selection state is applied in sync() */
  render () {
    const { iconsOnly, placeholder, searchable } = this.getAttr();
    const look     = this.look;
    const multiple = this.isMultiple;
    const options  = this.options;

    const icon = entry => entry.icon && html`<aufbau-icon icon="${entry.icon}"></aufbau-icon>`;

    const listbox = html`
      <div part="listbox" role="listbox" popover="manual" ${attrs({ 'aria-multiselectable': multiple && 'true' })}>
        ${options.map(entry => html`
          <div part="option" role="option" data-value="${entry.value}" tabindex="-1" aria-selected="false" ${attrs({ 'aria-disabled': entry.disabled && 'true' })}>
            ${icon(entry)}
            <span>${entry.label || entry.value}</span>
          </div>
        `)}
      </div>
    `;

    if (look === 'combobox') return html`
      <input type="text" part="field" role="combobox" aria-haspopup="listbox" aria-expanded="false" ${attrs({ placeholder, readonly: !searchable })} />
      <aufbau-icon part="caret" icon="lucide:chevron-down"></aufbau-icon>
      ${listbox}
    `;

    // content is filled in sync(), a click must not rebuild the button it lands on
    if (look === 'cycle') return html`
      <button type="button" part="trigger" aria-haspopup="listbox" aria-expanded="false">
        <aufbau-icon part="icon" hidden></aufbau-icon>
        <span part="label"></span>
      </button>
      ${listbox}
    `;

    // radio and segments share the markup, they differ only in styling. the group role sits on the host
    return html`${options.map(entry => {
      const name      = entry.label || entry.value;
      const showLabel = !(iconsOnly && entry.icon);

      return html`
        <button
          type="button"
          part="option"
          role="${multiple ? 'checkbox' : 'radio'}"
          data-value="${entry.value}"
          tabindex="-1"
          aria-checked="false"
          ${attrs({ 'aria-label': !showLabel && name, disabled: entry.disabled, title: !showLabel && name })}
        >
          ${icon(entry)}
          ${showLabel && html`<span>${entry.label}</span>`}
        </button>
      `;
    })}`;
  }

  sync () {
    super.sync();

    const look     = this.look;
    const selected = this.selected;
    const items    = this.items;

    if (this.internals) this.internals.role = GROUPED.has(look) ? (this.isMultiple ? 'group' : 'radiogroup') : null;

    // aria for assistive tech, the part token for the skin: ::part() cannot take attribute selectors
    for (const item of items) {
      const active = selected.has(item.dataset.value);
      item.setAttribute(item.getAttribute('role') === 'option' ? 'aria-selected' : 'aria-checked', String(active));
      item.part.toggle('selected', active);
    }

    // roving tabindex: exactly one stop per group, the selected one when there is one
    if (GROUPED.has(look)) {
      const stop = items.find(item => selected.has(item.dataset.value) && !isInactive(item))
                ?? items.find(item => !isInactive(item));
      for (const item of items) item.tabIndex = item === stop ? 0 : -1;
    }

    if (look === 'combobox') this.syncField(selected);
    if (look === 'cycle')    this.syncTrigger(selected);
  }

  syncField (selected) {
    const input = this.trigger;
    if (!input || input === this.focused) return;
    const labels = this.options.filter(entry => selected.has(entry.value)).map(entry => entry.label || entry.value);
    setValue(input, labels.join(', '));
  }

  syncTrigger (selected) {
    const button = this.trigger;
    if (!button) return;

    const current = this.options.find(entry => selected.has(entry.value));
    const name    = current ? (current.label || current.value) : this.getAttr('placeholder');
    const icon    = button.querySelector('aufbau-icon');
    const text    = button.querySelector('span');

    setAttr(icon, { hidden: !current?.icon, icon: current?.icon || false });
    text.textContent = name;
    text.hidden      = Boolean(this.getAttr('iconsOnly') && current?.icon);

    setAttr(button, { ariaLabel: name, title: name });
  }
}

AufbauPicker.init();
