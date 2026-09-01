// @aufbau/signals/scalarSignal.js

// :::::: IMPORT

import { Signal } from '@preact/signals';

// :::::: MAIN

class ScalarSignal extends Signal {
  
  constructor (value, values) {
    super(value);
    this.$ready  = null;
    this.$values = values ?? null;
  }
  
  get value () { return super.value; }
  
  set value (next) {
    if (this.$values && !this.$values.includes(next))
      return void console.warn(`[x] ignored "${next}" — not in [${this.$values}]`);
    super.value = next;
  }
  
  // steps to the next allowed value and wraps around — a two-value list is a toggle
  cycle () {
    if (!this.$values) return this.peek();
    let index = this.$values.indexOf(this.peek());
    super.value = this.$values[(index + 1) % this.$values.length];
    return this.peek();
  }
  
}

function scalarSignal (...args) {
  return new ScalarSignal (...args);
}

// :::::: EXPORT

export { ScalarSignal, scalarSignal };
export default ScalarSignal;
