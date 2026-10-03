import { byLabel, displayNames, enabled, listOf, listType, nameOf } from './list.js';

export default listType({
  attributes  : ['countries', 'flags'],
  icon        : 'lucide:map-pin',
  placeholder : 'country…',

  async entries (host, locale) {
    const { REGIONS } = await import('../../../data/regions.js');
    const names = displayNames(locale, 'region');
    const flags = enabled(host, 'flags');
    return listOf(host.getAttribute('countries'), REGIONS)
      .map(code => code.toUpperCase())
      .map(code => ({ icon: flags && `circle-flags:${code.toLowerCase()}`, label: nameOf(names, code), value: code }))
      .sort(byLabel(locale));
  },
});
