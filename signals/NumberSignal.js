// @aufbau/signals/NumberSignal.js
// a finite number, optionally bounded and stepped. a write that is not a number
// is ignored and warned about, like an enum value outside its list: one bad
// input must not turn the value into NaN for every reader.

// :::::: IMPORT

import { BaseSignal, callable } from './BaseSignal.js';

// :::::: HELPERS

// clamped to the bounds, snapped to min + n * step. null when not a number
function fit (next, { max, min, step }) {
  if (!Number.isFinite(next)) return null;
  let value = Math.min(max, Math.max(min, next));
  if (step > 0) {
    const origin = Number.isFinite(min) ? min : 0;
    value = Math.min(max, origin + Math.round((value - origin) / step) * step);
  }
  return value;
}

// :::::: MAIN

class NumberSignal extends BaseSignal {

  constructor (value = 0, { max = Infinity, min = -Infinity, step = 0 } = {}) {
    const bounds = { max, min, step };
    super(fit(Number(value), bounds) ?? fit(Math.max(0, min), bounds) ?? 0);
    this.$bounds = bounds;
  }

  get value ()     { return super.value; }
  set value (next) {
    const value = fit(typeof next === 'string' && next.trim() === '' ? NaN : Number(next), this.$bounds);
    if (value === null) return void console.warn(`[aufbau/signals] ignored "${next}" — not a number`);
    super.value = value;
  }

  increment (by = this.$bounds.step || 1) { this.value = this.peek() + by; return this.peek(); }
  decrement (by = this.$bounds.step || 1) { this.value = this.peek() - by; return this.peek(); }

  // hydration still clamps: bounds describe what the app can handle, a stored
  // value outside them would break it all the same
  $restore (next) { this.value = next; }

}

const numberSignal = (...args) => new NumberSignal(...args);

// :::::: EXPORT

const Callable = callable(NumberSignal);

export { Callable as NumberSignal, numberSignal };
export default Callable;
