// types/Angle.js

import { createFactory } from './base.js';
import { Num }           from './Num.js';

class AngleInstance extends Num {
  constructor (amount, unit = 'deg') {
    super(amount, unit);
  }
}

export const Angle = createFactory (AngleInstance, {
  deg  : (value) => new AngleInstance (value, 'deg'),
  grad : (value) => new AngleInstance (value, 'grad'),
  rad  : (value) => new AngleInstance (value, 'rad'),
  turn : (value) => new AngleInstance (value, 'turn'),
});

export default Angle;
