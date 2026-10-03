// <input-unit>
// a unit of measurement, as the identifier Intl uses: 'kilometer', 'celsius'.
// the list is Intl.supportedValuesOf(), the names come from Intl.NumberFormat in
// the language the element sits in.
//
//   <input-unit name="unit" value="kilometer"></input-unit>
//   <input-unit units="meter kilometer mile" look="segments"></input-unit>

import { define }                            from '../core/names.js';
import { byLabel, listOf, OptionsComponent } from '../core/OptionsComponent.js';

const UNITS = Intl.supportedValuesOf?.('unit') ?? [];

/** 'Kilometer (km)', the long name and the short symbol of a unit */
function unitLabel (unit, locale) {
  const name = display => {
    try {
      const parts = new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: display }).formatToParts(2);
      return parts.filter(part => part.type === 'unit').map(part => part.value).join(' ').trim();
    } catch { return ''; }
  };

  const long  = name('long')  || unit;
  const short = name('short');
  return short && short !== long ? `${long} (${short})` : long;
}

export class InputUnit extends OptionsComponent {

  static attr = {
    placeholder : 'unit…',
    units       : String,   // space separated identifiers, every unit Intl knows when absent
  };

  optionsKey () { return this.getAttr('units') ?? ''; }

  entries (locale) {
    return listOf(this.getAttr('units'), UNITS)
      .map(unit => ({ label: unitLabel(unit, locale), value: unit }))
      .sort(byLabel(locale));
  }
}

define('input-unit', InputUnit);

export default InputUnit;
