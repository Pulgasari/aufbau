// an emoji, as the character itself: '😀'. searched by its english unicode name:
// 'grinning', 'heart', 'cat'. every typed word has to start a word of the name,
// so 'cat' finds 'cat face', not 'identification'. without a query the first
// ones of the list show. `limit` caps the hits, 120 by default

import { listType, withCurrent } from './list.js';

function matches (name, words) {
  const parts = name.split(/[\s-]+/);
  return words.every(word => parts.some(part => part.startsWith(word)));
}

const entryOf = emoji => ({ label: emoji, value: emoji });

export default listType({
  attributes  : ['limit'],
  icon        : 'lucide:smile',
  look        : 'grid',
  placeholder : 'search emoji…',
  query       : true,

  async entries (host, locale, query) {
    const { EMOJI } = await import('../../data/emoji.js');
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const limit = Number(host.getAttribute('limit') ?? 120);

    const hits = [];
    for (const { emoji, name } of EMOJI) {
      if (hits.length >= limit) break;
      if (matches(name, words)) hits.push(entryOf(emoji));
    }

    return withCurrent(host, hits, entryOf);
  },
});
