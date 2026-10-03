// a currency as iso 4217 code: 'EUR'. `currencies` limits the list

import { byLabel, displayNames, listOf, listType, nameOf } from './list.js';

const CURRENCIES = Intl.supportedValuesOf?.('currency') ?? [];

export default listType({
  attributes  : ['currencies'],
  icon        : 'lucide:coins',
  placeholder : 'currency…',

  entries (host, locale) {
    const names = displayNames(locale, 'currency');
    return listOf(host.getAttribute('currencies'), CURRENCIES)
      .map(code => code.toUpperCase())
      .map(code => {
        const name = nameOf(names, code);
        return { label: name === code ? code : `${name} (${code})`, value: code };
      })
      .sort(byLabel(locale));
  },
});
