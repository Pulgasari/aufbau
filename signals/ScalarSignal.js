// @aufbau/signals/ScalarSignal.js
// any value, held as it is given. the plain carrier the other types specialise —
// reach for one of those when the value has a shape worth enforcing.

// :::::: IMPORT

import { Signal } from './shared.js';

// :::::: MAIN

class ScalarSignal extends Signal {

  constructor (value) {
    super(value);
    this.$ready = null;
  }

  get value ()     { return super.value; }
  set value (next) { super.value = next; }

}

const scalarSignal = (...args) => new ScalarSignal (...args);

// :::::: EXPORT

export { ScalarSignal, scalarSignal };
export default ScalarSignal;
