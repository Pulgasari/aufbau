// a font of @aufbau/webfonts by its id: 'manrope'. `categories` limits the list

import { byLabel, listOf, listType } from './list.js';

export default listType({
  attributes  : ['categories'],
  icon        : 'lucide:type',
  placeholder : 'font…',

  async entries (host, locale) {
    const { fonts }  = await import('@aufbau/webfonts');
    const categories = listOf(host.getAttribute('categories'), null);
    return fonts
      .filter(font => !categories || categories.includes(font.category))
      .map(font => ({ label: font.name, value: font.id }))
      .sort(byLabel(locale));
  },
});
