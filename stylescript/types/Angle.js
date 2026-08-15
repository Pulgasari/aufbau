// types/Angle.js

import { CssValue } from './base.js';

class AngleInstance extends CssValue {
  constructor (amount, unit = 'deg') {
    super(`${amount}${unit}`);
    this.amount = amount;
    this.unit   = unit;
  }
  toString() { return `${this.amount}${this.unit}`; }
}

export const Angle = Object.assign(
  (val, unit) => new AngleInstance(val, unit),
  {
    deg  : (v) => new AngleInstance(v, 'deg'),
    rad  : (v) => new AngleInstance(v, 'rad'),
    turn : (v) => new AngleInstance(v, 'turn'),
  }
);
