// @aufbau/signals/NumberSignal.js
// a finite number, optionally bounded and stepped. a write that is not a number
// is ignored and warned about, like an enum value outside its list: one bad
// input must not turn the value into NaN for every reader.

// :::::: IMPORT

import { BaseSignal, callable } from './BaseSignal.js';

// :::::: MAIN

class NumberSignal extends BaseSignal {

  constructor (value = 0, { max = Infinity, min = -Infinity, step = 0 } = {}) {
    super(0);
    Object.assign(this, { $max: max, $min: min, $step: step });
    super.value = this.#fit(Number(value)) ?? this.#fit(Math.max(0, min)) ?? 0;
  }

  // clamped to the bounds, snapped to min + n * step. null when not a number
  #fit (next) {
    if (!Number.isFinite(next)) return null;
    let value = Math.min(this.$max, Math.max(this.$min, next));
    if (this.$step > 0) {
      const origin = Number.isFinite(this.$min) ? this.$min : 0;
      value = Math.min(this.$max, origin + Math.round((value - origin) / this.$step) * this.$step);
    }
    return value;
  }

  get value ()     { return super.value; }
  set value (next) {
    const value = this.#fit(typeof next === 'string' && next.trim() === '' ? NaN : Number(next));
    if (value === null) return void console.warn(`[aufbau/signals] ignored "${next}" — not a number`);
    super.value = value;
  }

  increment (by = this.$step || 1) { this.value = this.peek() + by; return this.peek(); }
  decrement (by = this.$step || 1) { this.value = this.peek() - by; return this.peek(); }

  // hydration still clamps: bounds describe what the app can handle, a stored
  // value outside them would break it all the same
  $restore (next) { this.value = next; }

}

const numberSignal = (...args) => new NumberSignal(...args);

// :::::: EXPORT

const Callable = callable(NumberSignal);

export { Callable as NumberSignal, numberSignal };
export default Callable;
