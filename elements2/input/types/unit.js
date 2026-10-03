// a unit as Intl names it: 'kilometer'. `units` limits the list

import { byLabel, listOf, listType } from './list.js';

const UNITS = Intl.supportedValuesOf?.('unit') ?? [];

/** 'Kilometer (km)', the long name and the short symbol */
function labelOf (unit, locale) {
  const name = display => {
    try {
      const parts = new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: display }).formatToParts(2);
      return parts.filter(part => part.type === 'unit').map(part => part.value).join(' ').trim();
    } catch { return ''; }
  };
  const long  = name('long') || unit;
  const short = name('short');
  return short && short !== long ? `${long} (${short})` : long;
}

export default listType({
  attributes  : ['units'],
  icon        : 'lucide:ruler',
  placeholder : 'unit…',

  entries (host, locale) {
    return listOf(host.getAttribute('units'), UNITS)
      .map(unit => ({ label: labelOf(unit, locale), value: unit }))
      .sort(byLabel(locale));
  },
});
