// @aufbau/signals/RecordSignal.js

// :::::: IMPORT

import { isPlainObject } from './shared.js';
import { BaseSignal, callable } from './BaseSignal.js';

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

const recordSignal = (...args) => new RecordSignal(...args);

// :::::: EXPORT

const Callable = callable(RecordSignal);

export { Callable as RecordSignal, recordSignal };
export default Callable;
