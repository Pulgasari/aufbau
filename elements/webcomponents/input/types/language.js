import { byLabel, displayNames, enabled, listOf, listType, nameOf } from './list.js';

export default listType({
  attributes  : ['flags', 'languages', 'native'],
  icon        : 'lucide:languages',
  placeholder : 'language…',

  async entries (host, locale) {
    const { LANGUAGES } = await import('../../../data/languages.js');
    const names  = displayNames(locale, 'language');
    const flags  = enabled(host, 'flags');
    const native = enabled(host, 'native');

    return listOf(host.getAttribute('languages'), LANGUAGES)
      .map(code => {
        const label = nameOf(names, code);
        const own   = native ? nameOf(displayNames(code, 'language'), code) : null;
        return {
          icon  : flags && `circle-flags:lang-${code.split('-')[0].toLowerCase()}`,
          label : own && own !== label ? `${label} (${own})` : label,
          value : code,
        };
      })
      .sort(byLabel(locale));
  },
});
