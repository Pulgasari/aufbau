// types/Length.js

import { CssValue } from './base.js';

class LengthInstance extends CssValue {
  constructor (value, unit = 'px') {
    super();
    if (typeof value === 'number') {
      this.amount = value;
      this.unit   = unit;
    } else {
      const match = String(value).match(/^([0-9.]+)(.*)$/);
      this.amount = match ? parseFloat(match[1]) : 0;
      this.unit   = match && match[2] ? match[2] : unit;
    }
  }

  scale (factor) {
    return new LengthInstance(this.amount * factor, this.unit);
  }

  toString () {
    return `${this.amount}${this.unit}`;
  }
}

export const Length = createFactory (LengthInstance, {
  px  : (value) => new LengthInstance (value, 'px'),
  rem : (value) => new LengthInstance (value, 'rem'),
  em  : (value) => new LengthInstance (value, 'em'),
  vh  : (value) => new LengthInstance (value, 'vh'),
  vw  : (value) => new LengthInstance (value, 'vw'),
});
