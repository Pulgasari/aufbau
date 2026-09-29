// <pick-language>
// a language, as a bcp 47 tag: 'de', 'pt-BR'. the names come from
// Intl.DisplayNames in the language the element sits in (the nearest [lang]),
// followed by the name in the language itself.
//
//   <pick-language name="lang" value="de"></pick-language>
//   <pick-language languages="de en fr" look="segments"></pick-language>
//
// the value, the looks and the form behaviour are <aufbau-picker>'s.
// the flags are the language flags of circle-flags (circle-flags:lang-<code>).

import '@aufbau/elements/AufbauPicker.js';

import { attrs, html }                         from '@aufbau/elements/core/html.js';
import { AufbauComponent }                     from '../core/AufbauComponent.js';
import { displayNames, localeOf, nameOfCode } from '../core/locale.js';
import { define }                              from '../core/names.js';
import { LANGUAGES }                           from '../data/languages.js';

function languageOptions ({ codes, flags, locale, native }) {
  const names = displayNames(locale, 'language');

  return codes
    .map(code => {
      const label = nameOfCode(names, code);
      const own   = native ? nameOfCode(displayNames(code, 'language'), code) : null;
      return { code, label: own && own !== label ? `${label} (${own})` : label };
    })
    .sort((a, b) => a.label.localeCompare(b.label, locale))
    .map(({ code, label }) => {
      const option = document.createElement('aufbau-option');
      option.setAttribute('value', code);
      if (flags) option.setAttribute('icon', `circle-flags:lang-${code.split('-')[0].toLowerCase()}`);
      option.textContent = label;
      return option;
    });
}

export class PickLanguage extends AufbauComponent {

  static attr = {
    flags       : { type: Boolean, default: true },
    languages   : String,   // space separated tags, all of iso 639-1 when absent
    look        : { type: String, default: 'combobox', values: ['combobox', 'cycle', 'radio', 'segments'] },
    native      : { type: Boolean, default: true },
    placeholder : 'language…',
  };

  static control = 'aufbau-picker';
  static forward = ['look', 'placeholder'];

  render () {
    return html`<aufbau-picker searchable ${attrs({ value: this.initialValue })}></aufbau-picker>`;
  }

  // the options are rebuilt only when what they are made of changed
  sync () {
    super.sync();

    const control = this.control;
    if (!control) return;

    const { flags, languages, native } = this.getAttr();
    const locale = localeOf(this);
    const codes  = languages?.trim() ? languages.trim().split(/\s+/) : LANGUAGES;
    const key    = [locale, codes.join(' '), flags, native].join('|');
    if (key === this._optionsKey) return;

    this._optionsKey = key;
    control.replaceChildren(...languageOptions({ codes, flags, locale, native }));
  }
}

define('pick-language', PickLanguage);

export default PickLanguage;
