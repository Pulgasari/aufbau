// @aufbau/signals/EnumSignal.js
// a value out of a fixed list. a write outside it is ignored and warned about
// rather than thrown, so one bad value cannot take a render down with it.

// :::::: IMPORT

import { Signal } from './shared.js';

// :::::: MAIN

class EnumSignal extends Signal {

  constructor (value, values = []) {
    super(values.includes(value) ? value : values[0]);
    this.$ready  = null;
    this.$values = [...values];
  }

  get value ()     { return super.value; }
  set value (next) {
    if (!this.$values.includes(next))
      return void console.warn(`[aufbau/signals] ignored "${next}" — not in [${this.$values}]`);
    super.value = next;
  }

  // steps to the next allowed value and wraps around — a two-value list is a toggle
  cycle () {
    if (!this.$values.length) return this.peek();
    const index = this.$values.indexOf(this.peek());
    super.value = this.$values[(index + 1) % this.$values.length];
    return this.peek();
  }

  // hydration writes past the list: a stored value is authoritative, and it may
  // predate a change to the list it was written under.
  $restore (next) { super.value = next; }

}

const enumSignal = (...args) => new EnumSignal (...args);

// :::::: EXPORT

export { EnumSignal, enumSignal };
export default EnumSignal;
