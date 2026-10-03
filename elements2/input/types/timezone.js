// an iana time zone: 'Europe/Berlin', listed with its current offset. `zones` limits the list

import { listOf, listType } from './list.js';

const ZONES = Intl.supportedValuesOf?.('timeZone') ?? [];

/** 'GMT+2' for a zone right now */
function offsetOf (zone, locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date);
    return parts.find(part => part.type === 'timeZoneName')?.value ?? '';
  } catch { return ''; }
}

export default listType({
  attributes  : ['zones'],
  icon        : 'lucide:earth',
  placeholder : 'time zone…',

  entries (host, locale) {
    return listOf(host.getAttribute('zones'), ZONES).map(zone => {
      const offset = offsetOf(zone, locale);
      const name   = zone.replaceAll('_', ' ');
      return { label: offset ? `${name} (${offset})` : name, value: zone };
    });
  },
});
