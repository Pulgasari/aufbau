import { byLabel, displayNames, enabled, listOf, listType, nameOf } from './list.js';

const regionOf = tag => { try { return new Intl.Locale(tag).region ?? null; } catch { return null; } };

export default listType({
  attributes  : ['flags', 'locales'],
  icon        : 'lucide:globe',
  placeholder : 'locale…',

  async entries (host, locale) {
    const { LOCALES } = await import('../../data/locales.js');
    const names = displayNames(locale, 'language', { languageDisplay: 'standard' });
    const flags = enabled(host, 'flags');

    return listOf(host.getAttribute('locales'), LOCALES)
      .map(tag => {
        const region = regionOf(tag);
        return { icon: flags && region && `circle-flags:${region.toLowerCase()}`, label: nameOf(names, tag), value: tag };
      })
      .sort(byLabel(locale));
  },
});
