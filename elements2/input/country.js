// <input-country>
// a country, as an iso 3166-1 alpha-2 code: 'DE'. the names come from
// Intl.DisplayNames in the language the element sits in.
//
//   <input-country name="country" value="DE"></input-country>
//   <input-country countries="DE AT CH" look="segments"></input-country>
//
// the flags are circle-flags (circle-flags:<code>), the set <aufbau-flag> uses.

import { displayNames, nameOfCode }          from '../core/locale.js';
import { byLabel, listOf, OptionsComponent } from '../core/OptionsComponent.js';
import { REGIONS }                           from '../data/regions.js';

export class InputCountry extends OptionsComponent {

  static attr = {
    countries   : String,   // space separated codes, all of iso 3166-1 when absent
    flags       : { type: Boolean, default: true },
    placeholder : 'country…',
  };

  optionsKey () {
    const { countries, flags } = this.getAttr();
    return [countries, flags].join('|');
  }

  entries (locale) {
    const { countries, flags } = this.getAttr();
    const names = displayNames(locale, 'region');

    return listOf(countries, REGIONS)
      .map(code => code.toUpperCase())
      .map(code => ({ icon: flags && `circle-flags:${code.toLowerCase()}`, label: nameOfCode(names, code), value: code }))
      .sort(byLabel(locale));
  }
}

InputCountry.init('input-country');

export default InputCountry;
