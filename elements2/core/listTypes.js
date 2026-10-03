// @aufbau/elements2/core/listTypes.js
// value types whose values come from a list: a language, a country, a font.
// the same for <input-language> and <input-value type="language">.
//
//   attr      attributes the list is made of, merged into the schema of InputValue
//   entries   (host, locale) -> [{ value, label, icon }], or a promise of them
//   key       host -> a string that changes whenever the entries would
//   icon      leading icon of the field
//
// the entries are built again only when the key or the language changed, see
// InputValue.loadOptions().

import { displayNames, nameOfCode } from './locale.js';
import { LANGUAGES }                from '../data/languages.js';
import { LOCALES }                  from '../data/locales.js';
import { REGIONS }                  from '../data/regions.js';

// :::::: HELPERS :::::::::::::::::::::::::::::::::::::::::::::::

const CURRENCIES = Intl.supportedValuesOf?.('currency') ?? [];
const UNITS      = Intl.supportedValuesOf?.('unit')     ?? [];
const ZONES      = Intl.supportedValuesOf?.('timeZone') ?? [];

/** a space separated attribute as a list, the fallback when it is empty */
const listOf = (value, fallback) => value?.trim() ? value.trim().split(/\s+/) : fallback;

/** a boolean attribute that defaults to true: only "false" turns it off */
const enabled = (host, name) => host.getAttribute(name) !== 'false';

const byLabel = locale => (a, b) => a.label.localeCompare(b.label, locale);

const keyOf = (...names) => host => names.map(name => host.getAttribute(name) ?? '').join('|');

const regionOf = tag => { try { return new Intl.Locale(tag).region ?? null; } catch { return null; } };

/** 'GMT+2' for a zone right now, in the given locale */
function offsetOf (zone, locale) {
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(new Date);
    return parts.find(part => part.type === 'timeZoneName')?.value ?? '';
  } catch { return ''; }
}

/** 'Kilometer (km)', the long name and the short symbol of a unit */
function unitLabel (unit, locale) {
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

// :::::: TYPES :::::::::::::::::::::::::::::::::::::::::::::::::

const LIST_TYPES = {

  // an iso 3166-1 code: 'DE'
  country : {
    attr    : { countries: String, flags: String },
    icon    : 'lucide:map-pin',
    key     : keyOf('countries', 'flags'),
    entries (host, locale) {
      const names = displayNames(locale, 'region');
      const flags = enabled(host, 'flags');
      return listOf(host.getAttribute('countries'), REGIONS)
        .map(code => code.toUpperCase())
        .map(code => ({ icon: flags && `circle-flags:${code.toLowerCase()}`, label: nameOfCode(names, code), value: code }))
        .sort(byLabel(locale));
    },
  },

  // an iso 4217 code: 'EUR'
  currency : {
    attr    : { currencies: String },
    icon    : 'lucide:coins',
    key     : keyOf('currencies'),
    entries (host, locale) {
      const names = displayNames(locale, 'currency');
      return listOf(host.getAttribute('currencies'), CURRENCIES)
        .map(code => code.toUpperCase())
        .map(code => {
          const name = nameOfCode(names, code);
          return { label: name === code ? code : `${name} (${code})`, value: code };
        })
        .sort(byLabel(locale));
    },
  },

  // a font of @aufbau/webfonts, by its id: 'manrope'. the catalog is loaded on first use
  font : {
    attr    : { categories: String },
    icon    : 'lucide:type',
    key     : keyOf('categories'),
    async entries (host, locale) {
      const { fonts } = await import('@aufbau/webfonts');
      const categories = listOf(host.getAttribute('categories'), null);
      return fonts
        .filter(font => !categories || categories.includes(font.category))
        .map(font => ({ label: font.name, value: font.id }))
        .sort(byLabel(locale));
    },
  },

  // a bcp 47 language tag: 'de', 'pt-BR'. named in the page language and in its own
  language : {
    attr    : { flags: String, languages: String, native: String },
    icon    : 'lucide:languages',
    key     : keyOf('flags', 'languages', 'native'),
    entries (host, locale) {
      const names  = displayNames(locale, 'language');
      const flags  = enabled(host, 'flags');
      const native = enabled(host, 'native');
      return listOf(host.getAttribute('languages'), LANGUAGES)
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
    },
  },

  // a locale: 'de-AT'. 'Deutsch (Österreich)', not the dialect name
  locale : {
    attr    : { flags: String, locales: String },
    icon    : 'lucide:globe',
    key     : keyOf('flags', 'locales'),
    entries (host, locale) {
      const names = displayNames(locale, 'language', { languageDisplay: 'standard' });
      const flags = enabled(host, 'flags');
      return listOf(host.getAttribute('locales'), LOCALES)
        .map(tag => {
          const region = regionOf(tag);
          return { icon: flags && region && `circle-flags:${region.toLowerCase()}`, label: nameOfCode(names, tag), value: tag };
        })
        .sort(byLabel(locale));
    },
  },

  // an iana time zone: 'Europe/Berlin', listed with its current offset
  timezone : {
    attr    : { zones: String },
    icon    : 'lucide:earth',
    key     : keyOf('zones'),
    entries (host, locale) {
      return listOf(host.getAttribute('zones'), ZONES).map(zone => {
        const offset = offsetOf(zone, locale);
        const name   = zone.replaceAll('_', ' ');
        return { label: offset ? `${name} (${offset})` : name, value: zone };
      });
    },
  },

  // a unit as Intl names it: 'kilometer'
  unit : {
    attr    : { units: String },
    icon    : 'lucide:ruler',
    key     : keyOf('units'),
    entries (host, locale) {
      return listOf(host.getAttribute('units'), UNITS)
        .map(unit => ({ label: unitLabel(unit, locale), value: unit }))
        .sort(byLabel(locale));
    },
  },
};

// :::::: EXPORT ::::::::::::::::::::::::::::::::::::::::::::::::

export const
LIST_ATTR  = Object.assign({}, ...Object.values(LIST_TYPES).map(type => type.attr)),
LIST_NAMES = Object.keys(LIST_TYPES),
listType   = name => LIST_TYPES[name] ?? null;

export { LIST_TYPES };
