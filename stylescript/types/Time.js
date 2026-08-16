// types/Time.js

import { createFactory } from './base.js';
import { Num }           from './Num.js';

class TimeInstance extends Num {
  constructor (amount, unit = 'ms') {
    super(amount, unit);
  }

  toSeconds () {
    return this.unit === 's' ? this : new TimeInstance(this.amount / 1000, 's');
  }
}

export const Time = createFactory (TimeInstance, {
  ms : (value) => new TimeInstance (value, 'ms'),
  s  : (value) => new TimeInstance (value, 's'),
});

export default Time;
