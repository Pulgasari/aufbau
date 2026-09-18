// @aufbau/signals/BoolSignal.js

// :::::: IMPORT

import { BaseSignal, callable } from './BaseSignal.js';

// :::::: MAIN

class BoolSignal extends BaseSignal {

  constructor (value = false) {
    super(Boolean(value));
  }

  get value ()     { return super.value; }
  set value (next) { super.value = Boolean(next); }

  on     () { super.value = true;         return true;  }
  off    () { super.value = false;        return false; }
  toggle () { super.value = !this.peek(); return this.peek(); }

}

const boolSignal = (...args) => new BoolSignal(...args);

// :::::: EXPORT

const Callable = callable(BoolSignal);

export { Callable as BoolSignal, boolSignal };
export default Callable;
