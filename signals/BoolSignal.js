// @aufbau/signals/BoolSignal.js

// :::::: IMPORT

import { Signal } from './shared.js';

// :::::: MAIN

class BoolSignal extends Signal {

  constructor (value = false) {
    super(Boolean(value));
    this.$ready = null;
  }

  get value ()     { return super.value; }
  set value (next) { super.value = Boolean(next); }

  on     () { super.value = true;         return true;  }
  off    () { super.value = false;        return false; }
  toggle () { super.value = !this.peek(); return this.peek(); }

}

const boolSignal = (...args) => new BoolSignal (...args);

// :::::: EXPORT

export { BoolSignal, boolSignal };
export default BoolSignal;
