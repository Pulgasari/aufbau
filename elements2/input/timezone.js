// <input-timezone>
// a time zone, as an iana name: 'Europe/Berlin'. the list is
// Intl.supportedValuesOf(), each with its current offset: 'Europe/Berlin (GMT+2)'.
//
//   <input-timezone name="zone" value="Europe/Berlin"></input-timezone>
//   <input-timezone zones="Europe/Berlin America/New_York"></input-timezone>

import { listOf, OptionsComponent } from '../core/OptionsComponent.js';

const ZONES = Intl.supportedValuesOf?.('timeZone') ?? [];

/** 'GMT+2' for a zone right now, in the given locale */
function offsetOf (zone, locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date);
    return parts.find(part => part.type === 'timeZoneName')?.value ?? '';
  } catch { return ''; }
}

export class InputTimezone extends OptionsComponent {

  static attr = {
    placeholder : 'time zone…',
    zones       : String,   // space separated iana names, every zone Intl knows when absent
  };

  optionsKey () { return this.getAttr('zones') ?? ''; }

  // in the order Intl lists them, which is by name
  entries (locale) {
    return listOf(this.getAttr('zones'), ZONES).map(zone => {
      const offset = offsetOf(zone, locale);
      const name   = zone.replaceAll('_', ' ');
      return { label: offset ? `${name} (${offset})` : name, value: zone };
    });
  }
}

InputTimezone.init('input-timezone');

export default InputTimezone;
