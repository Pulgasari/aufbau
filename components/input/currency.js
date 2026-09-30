// <input-currency>
// a currency, as an iso 4217 code: 'EUR'. the list is Intl.supportedValuesOf(),
// the names come from Intl.DisplayNames in the language the element sits in.
//
//   <input-currency name="currency" value="EUR"></input-currency>
//   <input-currency currencies="EUR USD CHF" look="segments"></input-currency>

import { displayNames, nameOfCode }          from '../core/locale.js';
import { define }                            from '../core/names.js';
import { byLabel, listOf, OptionsComponent } from '../core/OptionsComponent.js';

const CURRENCIES = Intl.supportedValuesOf?.('currency') ?? [];

export class InputCurrency extends OptionsComponent {

  static attr = {
    currencies  : String,   // space separated codes, every currency Intl knows when absent
    placeholder : 'currency…',
  };

  optionsKey () { return this.getAttr('currencies') ?? ''; }

  entries (locale) {
    const names = displayNames(locale, 'currency');

    return listOf(this.getAttr('currencies'), CURRENCIES)
      .map(code => code.toUpperCase())
      .map(code => {
        const name = nameOfCode(names, code);
        return { label: name === code ? code : `${name} (${code})`, value: code };
      })
      .sort(byLabel(locale));
  }
}

define('input-currency', InputCurrency);

export default InputCurrency;
