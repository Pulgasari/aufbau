// @aufbau/signals/StringSignal.js
// a string, coerced on every write. null and undefined read as '' rather than
// leaking into the dom as the words "null" and "undefined".

// :::::: IMPORT

import { BaseSignal } from './BaseSignal.js';

// :::::: HELPERS

const asText = value => value == null ? '' : String(value);

// :::::: MAIN

class StringSignal extends BaseSignal {

  constructor (value = '') {
    super(asText(value));
  }

  get value ()     { return super.value; }
  set value (next) { super.value = asText(next); }

  get length () { return this.value.length; }

  clear () { super.value = ''; return ''; }

}

const stringSignal = (...args) => new StringSignal (...args);

// :::::: EXPORT

export { StringSignal, stringSignal };
export default StringSignal;
