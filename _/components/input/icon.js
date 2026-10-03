// <input-icon>
// an icon, as an iconify id: 'bx:search'. a search field over the iconify api
// and the hits as a row of icons to pick from.
//
//   <input-icon name="icon" value="lucide:star"></input-icon>
//   <input-icon prefixes="lucide bx" limit="96" query="arrow"></input-icon>

import { define, tagOf }                  from '../core/names.js';
import { SearchComponent, searchStyles } from '../core/SearchComponent.js';

const API = 'https://api.iconify.design/search';

const iconEntry = id => ({ icon: id, label: id, value: id });

export class InputIcon extends SearchComponent {

  static attr = {
    placeholder : 'search icons…',
    prefixes    : String,   // space separated iconify collections, all when absent
  };

  static iconsOnly = true;

  static styles () { return searchStyles(tagOf('input-icon')); }

  current (value) { return iconEntry(value); }

  // [] when there is no query or the api fails
  async results (query) {
    if (!query) return [];

    const { limit, prefixes } = this.getAttr();
    const params = new URLSearchParams({ limit: String(limit), query });
    if (prefixes?.trim()) params.set('prefixes', prefixes.trim().split(/\s+/).join(','));

    try {
      const response = await fetch(`${API}?${params}`);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return ((await response.json()).icons ?? []).map(iconEntry);
    } catch (error) {
      console.warn(`[${tagOf('input-icon')}] icon search failed:`, error);
      return [];
    }
  }
}

define('input-icon', InputIcon);

export default InputIcon;
