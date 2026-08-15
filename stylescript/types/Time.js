// types/Time.js

import { CssValue } from './base.js';

class TimeInstance extends CssValue {
  constructor (amount, unit = 'ms') {
    super(`${amount}${unit}`);
    this.amount = amount;
    this.unit   = unit;
  }
  toSeconds() { return this.unit === 's' ? this : new TimeInstance(this.amount / 1000, 's'); }
  toString() { return `${this.amount}${this.unit}`; }
}

export const Time = Object.assign(
  (value, unit) => new TimeInstance (value, unit),
  {
    ms : (value) => new TimeInstance (value, 'ms'),
    s  : (value) => new TimeInstance (value, 's'),
  }
);
