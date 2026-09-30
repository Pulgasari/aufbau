// @aufbau/components/core/OptionsComponent.js
// the base of every component that offers a list to pick from: an
// <aufbau-picker> whose options a subclass builds from its data. the options are
// rebuilt only when what they are made of changed (optionsKey()) or the
// language they are shown in did.

import '@aufbau/elements/AufbauPicker.js';

import { attrs, html }     from '@aufbau/elements/core/html.js';
import { AufbauComponent } from './AufbauComponent.js';
import { localeOf }        from './locale.js';

/** an <aufbau-option> from { value, label, icon } */
export function optionElement ({ icon, label, value }) {
  const option = document.createElement('aufbau-option');
  option.setAttribute('value', value);
  if (icon) option.setAttribute('icon', icon);
  option.textContent = label ?? value;
  return option;
}

/** a space separated attribute as a list, the fallback when it is empty */
export const listOf = (value, fallback) => value?.trim() ? value.trim().split(/\s+/) : fallback;

export class OptionsComponent extends AufbauComponent {

  static attr = {
    look        : { type: String, default: 'combobox', values: ['combobox', 'cycle', 'radio', 'segments'] },
    placeholder : String,
    searchable  : { type: Boolean, default: true },
    stepper     : Boolean,
  };

  static control = 'aufbau-picker';
  static forward = ['look', 'placeholder', 'searchable', 'stepper'];

  render () {
    return html`<aufbau-picker ${attrs({ value: this.initialValue })}></aufbau-picker>`;
  }

  /** hook, a string that changes whenever the options would */
  optionsKey () { return ''; }

  /** hook, [{ value, label, icon }] in the order they are shown. null leaves the options as they are */
  entries (locale) { return []; }

  sync () {
    super.sync();

    const control = this.control;
    if (!control) return;

    const locale = localeOf(this);
    const key    = `${locale}|${this.optionsKey()}`;
    if (key === this._optionsKey) return;
    this._optionsKey = key;

    const entries = this.entries(locale);
    if (entries) control.replaceChildren(...entries.map(optionElement));
  }
}

/** sorts entries by label in the given locale */
export const byLabel = locale => (a, b) => a.label.localeCompare(b.label, locale);

export default OptionsComponent;
