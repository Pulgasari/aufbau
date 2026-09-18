// @aufbau/signals/RecordSignal.js
// a plain object behind ONE signal, replaced on every write. the flat counterpart
// to deepSignal: a change here wakes every reader of the record, where a deep
// signal wakes only the readers of the leaf that moved. reach for this when the
// object is small and read as a whole (a position, a pair of bounds, a form's
// draft), and for deepSignal when its leaves are read apart from each other.
//
// the constructor takes the object itself — there is no config shape to confuse
// it with, so `new RecordSignal({ x: 0, y: 0 })` stores exactly that.

// :::::: IMPORT

import { isPlainObject } from './shared.js';
import { BaseSignal } from './BaseSignal.js';

// :::::: HELPERS

const asRecord = source => isPlainObject(source) ? { ...source } : {};

// :::::: MAIN

class RecordSignal extends BaseSignal {

  constructor (init = {}) {
    super(asRecord(init));
  }

  get value ()     { return super.value; }
  set value (next) { super.value = asRecord(next); }

  // ::: reads — all through .value, so they subscribe
  get size () { return Object.keys(this.value).length; }

  get     (key) { return this.value[key]; }
  has     (key) { return key in this.value; }
  keys    ()    { return Object.keys(this.value); }
  values  ()    { return Object.values(this.value); }
  entries ()    { return Object.entries(this.value); }

  // ::: writes
  set (key, value) { super.value = { ...this.peek(), [key]: value }; return value; }
  patch (source)   { super.value = { ...this.peek(), ...asRecord(source) }; }
  delete (key)     { const next = { ...this.peek() }; delete next[key]; super.value = next; }
  clear ()         { super.value = {}; }
  replace (source) { super.value = asRecord(source); }

  // a bare String() of this would read as [object Object]
  toText () { return JSON.stringify(this.value); }

  [Symbol.iterator] () { return Object.entries(this.value)[Symbol.iterator](); }

}

const recordSignal = (...args) => new RecordSignal (...args);

// :::::: EXPORT

export { RecordSignal, recordSignal };
export default RecordSignal;
