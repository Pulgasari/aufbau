// <input-locale>
// a language with its region, as a bcp 47 tag: 'de-AT', 'en-GB'. the names come
// from Intl.DisplayNames in the language the element sits in: 'Deutsch (Österreich)'.
//
//   <input-locale name="locale" value="de-DE"></input-locale>
//   <input-locale locales="de-DE de-AT de-CH"></input-locale>
//
// the flags are the ones of the region (circle-flags:<region>).

import { displayNames, nameOfCode }          from '../core/locale.js';
import { define }                            from '../core/names.js';
import { byLabel, listOf, OptionsComponent } from '../core/OptionsComponent.js';
import { LOCALES }                           from '../data/locales.js';

const regionOf = tag => { try { return new Intl.Locale(tag).region ?? null; } catch { return null; } };

export class InputLocale extends OptionsComponent {

  static attr = {
    flags       : { type: Boolean, default: true },
    locales     : String,   // space separated tags, a working set when absent
    placeholder : 'locale…',
  };

  optionsKey () {
    const { flags, locales } = this.getAttr();
    return [flags, locales].join('|');
  }

  entries (locale) {
    const { flags, locales } = this.getAttr();
    // standard: 'Deutsch (Österreich)', not the dialect name 'Österreichisches Deutsch'
    const names = displayNames(locale, 'language', { languageDisplay: 'standard' });

    return listOf(locales, LOCALES)
      .map(tag => {
        const region = regionOf(tag);
        return { icon: flags && region && `circle-flags:${region.toLowerCase()}`, label: nameOfCode(names, tag), value: tag };
      })
      .sort(byLabel(locale));
  }
}

define('input-locale', InputLocale);

export default InputLocale;
