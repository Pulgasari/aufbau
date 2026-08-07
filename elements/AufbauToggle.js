// <aufbau-toggle>
// a boolean. one-of-n belongs to <aufbau-picker>, not here.

import { AufbauControl } from './core/index.js';
import { html } from '@aufbau/js';

export default class AufbauToggle extends AufbauControl {
  static attr = {
    checked       : Boolean,
    indeterminate : Boolean,
    look          : { type: String, default: 'switch', values: ['switch', 'checkbox', 'button'] },
  };

  get checked ()     { return this.getAttr('checked'); }
  set checked (next) { this.setChecked(Boolean(next), { notify: false }); }

  /** native checkbox semantics: submit `value` (or 'on') when checked, nothing when not */
  get formValue () {
    if (!this.checked) return null;
    return this.getAttribute('value') ?? 'on';
  }

  onMount () {
    this._defaultChecked = this.hasAttribute('checked');

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
    const { label, look } = this.getAttr();

    return html`
      <button type="button" class="toggle-control toggle-${look}" role="${look === 'checkbox' ? 'checkbox' : 'switch'}" aria-checked="false" tabindex="0">
        <span class="toggle-thumb"></span>
      </button>
      ${label && html`<span class="toggle-label">${label}</span>`}
    `;
  }

  sync () {
    super.sync();

    const { checked, indeterminate } = this.getAttr();
    const control = this.$('.toggle-control');
    if (!control) return;

    control.setAttribute('aria-checked', indeterminate ? 'mixed' : String(checked));
    control.classList.toggle('is-active', checked);
    control.classList.toggle('is-indeterminate', indeterminate);
    this.classList.toggle('is-checked', checked);
  }
}

AufbauToggle.init();
