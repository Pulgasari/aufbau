// <input-emoji>
// an emoji, as the character itself: '😀'. searched by its unicode name, in
// english: 'grinning', 'heart', 'cat'. without a query the first ones of the
// list are shown.
//
//   <input-emoji name="emoji" value="🙂"></input-emoji>
//
// single code points only for now, see data/emoji.js.

import { define, tagOf }                  from '../core/names.js';
import { SearchComponent, searchStyles } from '../core/SearchComponent.js';
import { EMOJI }                          from '../data/emoji.js';

const emojiEntry = ({ emoji, name }) => ({ label: emoji, value: emoji, name });

export class InputEmoji extends SearchComponent {

  static attr = {
    limit       : { type: Number, default: 120 },
    placeholder : 'search emoji…',
  };

  static styles () { return searchStyles(tagOf('input-emoji')); }

  current (value) { return { label: value, value }; }

  // every word of the query starts a word of the name: 'cat' finds 'cat face', not 'identification'
  results (query) {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return EMOJI
      .filter(({ name }) => {
        const parts = name.split(/[\s-]+/);
        return words.every(word => parts.some(part => part.startsWith(word)));
      })
      .slice(0, this.getAttr('limit'))
      .map(emojiEntry);
  }
}

define('input-emoji', InputEmoji);

export default InputEmoji;
