// <aufbau-toggle>
// a boolean. one-of-n belongs to <aufbau-picker>, not here.
// the host IS the control: role, checked state and focus live on it. the track,
// thumb and checkbox mark are pseudo elements, the only children are the
// optional icon and the label.

import { AufbauControl } from './core/index.js';
import { html }          from './core/html.js';

const ROLES = { button: 'button', checkbox: 'checkbox', switch: 'switch' };

export default class AufbauToggle extends AufbauControl {
  static attr = {
    checked       : Boolean,
    // set either one to swap the css drawn track/mark for an <aufbau-icon>,
    // e.g. icon="famicons:toggle-outline" icon-checked="famicons:toggle"
    icon          : String,
    iconChecked   : String,
    indeterminate : Boolean,
    look          : { type: String, default: 'switch', values: ['switch', 'checkbox', 'button'] },
  };

  // structure only. the track, the thumb and the mark get their borders and
  // colours from the skin, everything here is geometry. the thumb and the mark
  // are placed with inset, so `translate`, `rotate` and `scale` stay free for the skin
  static styles = `aufbau-toggle {
    --toggle-size  : 1.25em;
    --toggle-track : 2.25em;
    --toggle-pad   : 0.15em;

    align-items : center;
    cursor      : pointer;
    display     : inline-flex;
    gap         : var(--aufbau-control-gap, 0.5em);
    position    : relative;
    user-select : none;

    > aufbau-icon { --icon-size: var(--toggle-size); flex: none; }
    > span        { line-height: 1.2; }

    &::before,
    &::after { box-sizing: border-box; flex: none; }

    /* switch: ::before is the track, ::after the thumb sliding in it */
    &[look="switch"] {
      --toggle-thumb: calc(var(--toggle-size) - 2 * var(--toggle-pad));

      &::before {
        block-size  : var(--toggle-size);
        content     : '';
        inline-size : var(--toggle-track);
      }

      &::after {
        block-size         : var(--toggle-thumb);
        content            : '';
        inline-size        : var(--toggle-thumb);
        inset-block-start  : calc(50% - var(--toggle-thumb) / 2);
        inset-inline-start : var(--toggle-pad);
        position           : absolute;
        transition         : translate 0.15s ease;
      }

      &[checked]::after { translate: calc(var(--toggle-track) - var(--toggle-size)) 0; }
    }

    /* checkbox: ::before is the box, ::after the mark inside it */
    &[look="checkbox"] {
      --toggle-mark: calc(var(--toggle-size) * 0.55);

      &::before {
        block-size  : var(--toggle-size);
        content     : '';
        inline-size : var(--toggle-size);
      }

      &::after {
        block-size         : var(--toggle-mark);
        content            : '';
        inline-size        : var(--toggle-mark);
        inset-block-start  : calc(50% - var(--toggle-mark) / 2);
        inset-inline-start : calc((var(--toggle-size) - var(--toggle-mark)) / 2);
        position           : absolute;
      }
    }

    /* button: the host is a pill that reads as pressed */
    &[look="button"] {
      block-size      : calc(var(--toggle-size) * 1.2);
      justify-content : center;
      min-inline-size : calc(var(--toggle-track) * 1.1);
      padding-inline  : 0.6em;
    }

    /* an icon replaces the drawn track or box */
    &:is([icon], [icon-checked])::before,
    &:is([icon], [icon-checked])::after { content: none; }
  }`;

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
    // the resolved look is reflected, so every look is selectable as [look="…"], the default included
    if (this.getAttribute('look') !== this.getAttr('look')) this.setAttribute('look', this.getAttr('look'));

    this.on('click', () => this.toggle());

    // native timing does not apply, there is no inner button any more:
    // space toggles every look, enter only the button look, like a native button
    this.on('keydown', (event) => {
      if (event.target !== this) return;
      if (event.key === ' ' || (event.key === 'Enter' && this.getAttr('look') === 'button')) {
        event.preventDefault();
        this.toggle();
      }
    });
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
    const { icon, iconChecked, label } = this.getAttr();

    // the label is the content of the control, so it names it without any aria wiring
    return html`
      ${(icon || iconChecked) && html`<aufbau-icon></aufbau-icon>`}
      ${label && html`<span>${label}</span>`}
    `;
  }

  sync () {
    super.sync();

    const { checked, icon, iconChecked, indeterminate, label, look } = this.getAttr();
    const internals = this._internals;

    // super.sync() drops the tabindex for inner focusables, here the host is the focus stop
    this.tabIndex = this.isDisabled ? -1 : 0;

    if (internals) {
      internals.role        = ROLES[look];
      internals.ariaChecked = look === 'button' ? null : (indeterminate ? 'mixed' : String(checked));
      internals.ariaPressed = look === 'button' ? String(checked) : null;
      // the visible label already names the control, one control, one name
      if (label) internals.ariaLabel = null;
    }

    // one of the two may be missing, fall back to whichever was given
    const iconElement = this.$(':scope > aufbau-icon');
    if (iconElement) iconElement.setAttribute('icon', (checked ? iconChecked || icon : icon || iconChecked) ?? '');
  }
}

AufbauToggle.init();
