// @aufbau/signals/BoolSignal.js

// :::::: IMPORT

import { Signal } from './shared.js';

// :::::: MAIN
// a signal that only ever holds a boolean. every write is coerced, so `on()`, a stored
// value, or a raw `.value =` all normalize to true/false.
// caveat: coercion is plain truthiness — the string 'false' is truthy, hence true. feed
// it real booleans (JSON round-trips them) or use on()/off()/toggle().

class BoolSignal extends Signal {

  constructor (value = false) {
    super(Boolean(value));
    this.$ready = null;
  }

  get value () { return super.value; }

  set value (next) { super.value = Boolean(next); }

  // flip and return the new state — a bare toggle needs no argument
  toggle () { super.value = !this.peek(); return this.peek(); }

  on  () { super.value = true;  return true;  }
  off () { super.value = false; return false; }

}

function boolSignal (...args) {
  return new BoolSignal (...args);
}

// :::::: EXPORT

export { BoolSignal, boolSignal };
export default BoolSignal;
