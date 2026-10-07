import { AufbauElement } from '@aufbau/element';

const LOREM = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');

// string -> 32 bit number, the start of a seeded sequence
function hashOf (text) {
  let value = 2166136261;
  for (const char of String(text)) value = Math.imul(value ^ char.codePointAt(0), 16777619);
  return value >>> 0;
}

// mulberry32, the same seed gives the same numbers
function sequence (seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function lorem ({ classic = false, random = Math.random, words = 50 } = {}) {
  const list = Array.from({ length: words }, () => LOREM[Math.floor(random() * LOREM.length)]);
  if (classic) list.splice(0, 5, ...LOREM.slice(0, 5));

  // sentences of 5 to 14 words, now and then a comma
  let text = '', left = 0;
  list.forEach((word, index) => {
    if (left === 0) {
      left = 5 + Math.floor(random() * 10);
      word = word[0].toUpperCase() + word.slice(1);
      if (index) text += ' ';
    }
    else text += left > 2 && random() < 0.1 ? ', ' : ' ';
    text += word;
    if (--left === 0 || index === list.length - 1) { text += '.'; left = 0; }
  });

  return text;
}

// a paragraph of lorem ipsum. with a seed it stays the same between loads,
// without one it stays the same for the element's life
export default class MockP extends AufbauElement {
  static attr = {
    classic : Boolean,
    seed    : String,
    words   : 50,
  };

  static styles = `mock-p {
    display           : block;
    padding-block-end : --space(normal);
  }`;

  own = Math.floor(Math.random() * 4294967296);

  render () {
    const { classic, seed, words } = this.getAttr();
    const random = sequence(seed ? hashOf(seed) : this.own);
    return lorem({ classic, random, words: Math.max(1, words) });
  }
}

MockP.init();
