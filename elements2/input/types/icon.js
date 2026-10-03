// an icon, as an iconify id: 'lucide:star'. searched over the iconify api,
// nothing shows before something is typed. `prefixes` limits the collections
// (space separated), `limit` caps the hits, 64 by default

import { listType, withCurrent } from './list.js';

const API = 'https://api.iconify.design/search';

const entryOf = id => ({ icon: id, label: id, value: id });

async function search (query, { limit, prefixes }) {
  const params = new URLSearchParams({ limit: String(limit), query });
  if (prefixes?.trim()) params.set('prefixes', prefixes.trim().split(/\s+/).join(','));

  const response = await fetch(`${API}?${params}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const { icons = [] } = await response.json();
  return icons;
}

export default listType({
  attributes  : ['limit', 'prefixes'],
  icon        : 'lucide:shapes',
  look        : 'grid',
  placeholder : 'search icons…',
  query       : true,

  async entries (host, locale, query) {
    if (!query) return withCurrent(host, [], entryOf);

    const limit    = Number(host.getAttribute('limit') ?? 64);
    const prefixes = host.getAttribute('prefixes');
    const icons    = await search(query, { limit, prefixes });

    return withCurrent(host, icons.map(entryOf), entryOf);
  },
});
