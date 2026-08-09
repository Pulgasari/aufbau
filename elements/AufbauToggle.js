// <aufbau-toggle>
// a boolean. one-of-n belongs to <aufbau-picker>, not here.

import { AufbauControl } from './core/index.js';
import { html } from '@aufbau/js';

export default class AufbauToggle extends AufbauControl {
  static attr = {
    checked       : Boolean,
    // set either one to swap the css drawn thumb for an <aufbau-icon>,
    // e.g. icon="famicons:toggle-outline" icon-checked="famicons:toggle"
    icon          : String,
    iconChecked   : String,
    indeterminate : Boolean,
    look          : { type: String, default: 'switch', values: ['switch', 'checkbox', 'button'] },
  };

  // structure only. the track, the thumb and the mark get their borders and
  // colours from the skin, everything here is geometry
  static styles = `
    aufbau-toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--aufbau-control-gap, 0.5em);
      cursor: pointer;

      --toggle-size  : 1.25em;
      --toggle-track : 2.25em;
      --toggle-pad   : 0.15em;
    }

    aufbau-toggle .toggle-control {
      display: inline-flex;
      align-items: center;
      flex: none;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: inherit;
    }

    aufbau-toggle .toggle-thumb {
      display: block;
      flex: none;
    }

    /* switch: a track the thumb slides in */
    aufbau-toggle .toggle-switch {
      inline-size: var(--toggle-track);
      block-size: var(--toggle-size);
      padding: var(--toggle-pad);
      justify-content: flex-start;
    }

    aufbau-toggle .toggle-switch .toggle-thumb {
      inline-size: calc(var(--toggle-size) - 2 * var(--toggle-pad));
      block-size: calc(var(--toggle-size) - 2 * var(--toggle-pad));
      transition: translate 0.15s ease;
    }

    aufbau-toggle .toggle-switch.is-active .toggle-thumb {
      translate: calc(var(--toggle-track) - var(--toggle-size)) 0;
    }

    /* checkbox: a square box, the thumb is the mark inside it */
    aufbau-toggle .toggle-checkbox {
      inline-size: var(--toggle-size);
      block-size: var(--toggle-size);
      justify-content: center;
    }

    aufbau-toggle .toggle-checkbox .toggle-thumb {
      inline-size: calc(var(--toggle-size) * 0.55);
      block-size: calc(var(--toggle-size) * 0.55);
    }

    /* button: a pill that reads as pressed */
    aufbau-toggle .toggle-button {
      min-inline-size: calc(var(--toggle-track) * 1.1);
      block-size: calc(var(--toggle-size) * 1.2);
      padding-inline: 0.6em;
      justify-content: center;
    }

    aufbau-toggle .toggle-button .toggle-thumb { display: none; }

    aufbau-toggle .toggle-icon {
      --icon-size: var(--toggle-size);
      flex: none;
    }

    aufbau-toggle .toggle-label { line-height: 1.2; }
  `;

  get checked ()     { return this.getAttr('checked'); }
  set checked (next) { this.setChecked(Boolean(next), { notify: false }); }

  /** native checkbox semantics: submit `value` (or 'on') when checked, nothing when not */
  get formValue () {
    if (!this.checked) return null;
    return this.getAttribute('value') ?? 'on';
  }

  // the state lives in `checked`, not in `value`, so both persistence ends are
  // overridden. formStateRestoreCallback cannot be reused here, it only tests
  // for null and would read the string 'false' as checked
  get persistedState () { return String(this.checked); }

  restorePersisted (state) { this.setChecked(state === 'true', { notify: false }); }

  captureDefaults () {
    super.captureDefaults();
    this._defaultChecked ??= this.hasAttribute('checked');
    return this;
  }

  onMount () {
    // the inner <button> already turns space and enter into a click,
    // a keydown handler here would toggle twice
    this.on('click', () => this.toggle());
  }

  toggle () { return this.setChecked(!this.checked); }

  setChecked (checked, { notify = true } = {}) {
    if (this.isDisabled || this.getAttr('readonly')) return this;

    this.setAttr({ checked, indeterminate: false });
    this.syncFormState();
    if (notify) this.notify();
    return this;
  }

  formResetCallback () { this.setChecked(this._defaultChecked, { notify: false }); }

  formStateRestoreCallback (state) { this.setChecked(state != null, { notify: false }); }

  render () {
    const { icon, iconChecked, label, look } = this.getAttr();
    const withIcon = Boolean(icon || iconChecked);

    return html`
      <button type="button" class="toggle-control toggle-${look}" role="${look === 'checkbox' ? 'checkbox' : 'switch'}" aria-checked="false" tabindex="0">
        ${withIcon ? html`<aufbau-icon class="toggle-icon"></aufbau-icon>`
                   : html`<span class="toggle-thumb"></span>`}
      </button>
      ${label && html`<span class="toggle-label">${label}</span>`}
    `;
  }

  sync () {
    super.sync();

    const { checked, icon, iconChecked, indeterminate } = this.getAttr();
    const control = this.$('.toggle-control');
    if (!control) return;

    control.setAttribute('aria-checked', indeterminate ? 'mixed' : String(checked));
    control.classList.toggle('is-active', checked);
    control.classList.toggle('is-indeterminate', indeterminate);
    this.classList.toggle('is-checked', checked);

    // one of the two may be missing, fall back to whichever was given
    const iconEl = this.$('.toggle-icon');
    if (iconEl) iconEl.setAttribute('icon', (checked ? iconChecked || icon : icon || iconChecked) ?? '');
  }
}

AufbauToggle.init();
