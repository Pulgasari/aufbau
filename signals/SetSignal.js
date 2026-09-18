// @aufbau/signals/SetSignal.js
// a Set behind a signal. every mutator copies before it writes, so each change
// publishes a fresh reference — a Set mutated in place would never notify.

// :::::: IMPORT

import { Signal } from './shared.js';

// :::::: HELPERS

const asSet = source => source instanceof Set ? source : new Set(source ?? []);

// :::::: MAIN

class SetSignal extends Signal {

  constructor (init = []) {
    super(asSet(init));
    this.$ready = null;
  }

  get value ()     { return super.value; }
  set value (next) { super.value = asSet(next); }

  #mutate (fn) {
    const next = new Set(this.peek());
    fn(next);
    super.value = next;
    return next;
  }

  // ::: size + reads — all through .value, so they subscribe
  get size () { return this.value.size; }

  has     (item) { return this.value.has(item); }
  values  ()     { return this.value.values(); }
  forEach (fn)   { return this.value.forEach(fn); }

  // ::: writes
  add     (item)   { this.#mutate(set => set.add(item)); return item; }
  delete  (item)   { this.#mutate(set => set.delete(item)); }
  toggle  (item)   { this.#mutate(set => set.has(item) ? set.delete(item) : set.add(item)); return this.peek().has(item); }
  clear   ()       { super.value = new Set; }
  replace (source) { super.value = asSet(source); }

  // ::: serialization
  toArray () { return [...this.value]; }

  [Symbol.iterator] () { return this.value[Symbol.iterator](); }

}

const setSignal = (...args) => new SetSignal (...args);

// :::::: EXPORT

export { SetSignal, setSignal };
export default SetSignal;
