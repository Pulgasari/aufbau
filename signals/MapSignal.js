// @aufbau/signals/MapSignal.js
// a Map behind a signal. every mutator copies before it writes, so each change
// publishes a fresh reference — a Map mutated in place would never notify.

// :::::: IMPORT

import { toEntries } from './shared.js';
import { BaseSignal } from './BaseSignal.js';

// :::::: HELPERS

const asMap = source => source instanceof Map ? source : new Map(toEntries(source ?? []));

// :::::: MAIN

class MapSignal extends BaseSignal {

  constructor (init = []) {
    super(asMap(init));
  }

  get value ()     { return super.value; }
  set value (next) { super.value = asMap(next); }

  #mutate (fn) {
    const next = new Map(this.peek());
    fn(next);
    super.value = next;
    return next;
  }

  // ::: size + reads — all through .value, so they subscribe
  get size () { return this.value.size; }

  get     (key) { return this.value.get(key); }
  has     (key) { return this.value.has(key); }
  keys    ()    { return this.value.keys(); }
  values  ()    { return this.value.values(); }
  entries ()    { return this.value.entries(); }
  forEach (fn)  { return this.value.forEach(fn); }

  // ::: writes
  set     (key, value) { this.#mutate(map => map.set(key, value)); return value; }
  delete  (key)        { this.#mutate(map => map.delete(key)); }
  clear   ()           { super.value = new Map; }
  replace (source)     { super.value = asMap(source); }

  // ::: serialization
  toArray  () { return [...this.value.entries()]; }
  toObject () { return Object.fromEntries(this.value); }

  // a bare String() of this would read as [object Object]
  toText () { return JSON.stringify(this.toObject()); }

  [Symbol.iterator] () { return this.value[Symbol.iterator](); }

}

const mapSignal = (...args) => new MapSignal (...args);

// :::::: EXPORT

export { MapSignal, mapSignal };
export default MapSignal;
