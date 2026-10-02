// <input-language>
// a language, as a bcp 47 tag: 'de', 'pt-BR'. the names come from
// Intl.DisplayNames in the language the element sits in (the nearest [lang]),
// followed by the name in the language itself.
//
//   <input-language name="lang" value="de"></input-language>
//   <input-language languages="de en fr" look="segments"></input-language>
//
// the flags are the language flags of circle-flags (circle-flags:lang-<code>).

import { displayNames, nameOfCode }          from '../core/locale.js';
import { byLabel, listOf, OptionsComponent } from '../core/OptionsComponent.js';
import { LANGUAGES }                         from '../data/languages.js';

export class InputLanguage extends OptionsComponent {

  static attr = {
    flags       : { type: Boolean, default: true },
    languages   : String,   // space separated tags, all of iso 639-1 when absent
    native      : { type: Boolean, default: true },
    placeholder : 'language…',
  };

  optionsKey () {
    const { flags, languages, native } = this.getAttr();
    return [flags, languages, native].join('|');
  }

  entries (locale) {
    const { flags, languages, native } = this.getAttr();
    const names = displayNames(locale, 'language');

    return listOf(languages, LANGUAGES)
      .map(code => {
        const label = nameOfCode(names, code);
        const own   = native ? nameOfCode(displayNames(code, 'language'), code) : null;
        return {
          icon  : flags && `circle-flags:lang-${code.split('-')[0].toLowerCase()}`,
          label : own && own !== label ? `${label} (${own})` : label,
          value : code,
        };
      })
      .sort(byLabel(locale));
  }
}

InputLanguage.init('input-language');

export default InputLanguage;
